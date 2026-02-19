/**
 * Lightweight Dutch Swiss pairing algorithm.
 * Handles score groups, color alternation, bye assignment, and rematch avoidance.
 */

/**
 * Compute points for a team from past results.
 * @param {number} teamId
 * @param {Array} pairings - all pairings rows from DB
 * @returns {number} total points (win=1, draw=0.5, loss=0, bye=1)
 */
export function computeScore(teamId, pairings) {
  let score = 0;
  for (const p of pairings) {
    if (p.result === null) continue;
    const isTeam1 = p.team1_id === teamId;
    const isTeam2 = p.team2_id === teamId;
    if (!isTeam1 && !isTeam2) continue;

    if (p.result === 'bye') {
      score += 1;
    } else if (p.result === '1-0') {
      score += isTeam1 ? 1 : 0;
    } else if (p.result === '0-1') {
      score += isTeam2 ? 1 : 0;
    } else if (p.result === '1/2-1/2') {
      score += 0.5;
    }
  }
  return score;
}

/**
 * Return the set of opponent IDs a team has already played.
 * @param {number} teamId
 * @param {Array} pairings
 * @returns {Set<number>}
 */
function getOpponents(teamId, pairings) {
  const opponents = new Set();
  for (const p of pairings) {
    if (p.team2_id === null) continue; // bye
    if (p.team1_id === teamId) opponents.add(p.team2_id);
    if (p.team2_id === teamId) opponents.add(p.team1_id);
  }
  return opponents;
}

/**
 * Get the last color played by a team ('W', 'B', or null).
 * @param {number} teamId
 * @param {Array} pairings - sorted oldest-first
 * @returns {'W'|'B'|null}
 */
function getLastColor(teamId, pairings) {
  // Walk backwards to find their most recent non-bye game
  for (let i = pairings.length - 1; i >= 0; i--) {
    const p = pairings[i];
    if (p.result === 'bye') continue;
    if (p.team1_id === teamId) return p.color1;
    if (p.team2_id === teamId) return p.color1 === 'W' ? 'B' : 'W';
  }
  return null;
}

/**
 * Assign colors to a pair (team1 vs team2).
 * Tries to alternate from each team's last color.
 * Higher-ranked team (lower index in sorted standings) wins a color conflict.
 * @param {number} team1Id - higher ranked
 * @param {number} team2Id - lower ranked
 * @param {Array} pairings
 * @returns {'W'|'B'} color for team1
 */
function assignColor(team1Id, team2Id, pairings) {
  const last1 = getLastColor(team1Id, pairings);
  const last2 = getLastColor(team2Id, pairings);

  // Both need white or both need black → higher ranked gets preference
  const wants1White = last1 === 'B' || last1 === null;
  const wants2White = last2 === 'B' || last2 === null;

  if (wants1White && !wants2White) return 'W';
  if (!wants1White && wants2White) return 'B';
  // Conflict: higher-ranked (team1) gets what they want
  return wants1White ? 'W' : 'B';
}

/**
 * Generate pairings for the next round using Dutch Swiss.
 *
 * @param {Array} teams - all registered teams: { id, team_name, rating1, rating2 }
 * @param {Array} prevPairings - all pairings from previous rounds (sorted oldest-first)
 * @returns {Array} new pairings: { board_num, team1_id, team2_id, color1 }
 *   team2_id is null for byes.
 */
export function generatePairings(teams, prevPairings) {
  const teamIds = teams.map(t => t.id);
  const seedRating = Object.fromEntries(
    teams.map(t => [t.id, (t.rating1 + t.rating2) / 2])
  );

  // Build standings: [{ id, score }] sorted by score desc, then seed rating desc
  const standings = teamIds
    .map(id => ({ id, score: computeScore(id, prevPairings) }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : (seedRating[b.id] ?? 0) - (seedRating[a.id] ?? 0)
    );

  // Build opponent history
  const history = Object.fromEntries(
    teamIds.map(id => [id, getOpponents(id, prevPairings)])
  );

  const paired = new Set();
  const result = [];
  let boardNum = 1;

  // Handle bye: if odd number of teams, find lowest-ranked team without a bye
  let byeTeamId = null;
  if (standings.length % 2 !== 0) {
    // Walk from bottom of standings
    const teamsWithBye = new Set(
      prevPairings
        .filter(p => p.result === 'bye')
        .map(p => p.team1_id)
    );
    for (let i = standings.length - 1; i >= 0; i--) {
      if (!teamsWithBye.has(standings[i].id)) {
        byeTeamId = standings[i].id;
        break;
      }
    }
    // Fallback: give bye to bottom team regardless
    if (byeTeamId === null) {
      byeTeamId = standings[standings.length - 1].id;
    }
    paired.add(byeTeamId);
  }

  // Pair remaining teams in score group order
  for (let i = 0; i < standings.length; i++) {
    const t1 = standings[i];
    if (paired.has(t1.id)) continue;

    // Find best pairing partner: same score group first, no rematch
    let partnerId = null;
    for (let j = i + 1; j < standings.length; j++) {
      const t2 = standings[j];
      if (paired.has(t2.id)) continue;
      if (!history[t1.id].has(t2.id)) {
        partnerId = t2.id;
        break;
      }
    }

    // No valid partner found (all already played) — float down and pair with next available
    if (partnerId === null) {
      for (let j = i + 1; j < standings.length; j++) {
        const t2 = standings[j];
        if (!paired.has(t2.id)) {
          partnerId = t2.id;
          break;
        }
      }
    }

    if (partnerId === null) {
      // Shouldn't happen in normal Swiss — give a bye as fallback
      result.push({ board_num: boardNum++, team1_id: t1.id, team2_id: null, color1: null });
      paired.add(t1.id);
      continue;
    }

    const color1 = assignColor(t1.id, partnerId, prevPairings);
    result.push({ board_num: boardNum++, team1_id: t1.id, team2_id: partnerId, color1 });
    paired.add(t1.id);
    paired.add(partnerId);
  }

  // Add bye pairing last
  if (byeTeamId !== null) {
    result.push({ board_num: boardNum, team1_id: byeTeamId, team2_id: null, color1: null });
  }

  return result;
}
