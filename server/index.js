import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import client, { getRegistrationCount } from './db.js';
import { generatePairings, generateRoundRobinPairings, generateRandomPairings, computeScore } from './swiss.js';

const VALID_ALGORITHMS = ['swiss', 'roundrobin', 'random'];

/** Dispatch to the correct pairing function based on algorithm. */
function buildPairings(algorithm, teams, prevPairings, roundNum) {
  if (algorithm === 'roundrobin') return generateRoundRobinPairings(teams, roundNum);
  if (algorithm === 'random') return generateRandomPairings(teams, prevPairings);
  return generatePairings(teams, prevPairings);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const MAX_TEAMS = 70;
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  app.use(cors({ origin: 'http://localhost:3000' }));
} else {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}
app.use(express.json());

// GET /api/slots — current slot availability
app.get('/api/slots', async (_req, res) => {
  const registered = await getRegistrationCount();
  res.json({ registered, remaining: MAX_TEAMS - registered });
});

// POST /api/register — submit a team registration
app.post('/api/register', async (req, res) => {
  const { teamName, player1, player2, rating1, rating2, mobile } = req.body;

  if (!teamName?.trim() || !player1?.trim() || !player2?.trim() || !mobile?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!/^(\+63|0)9\d{9}$/.test(mobile.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Invalid mobile number. Use format: 09XX XXX XXXX.' });
  }

  const r1 = Number(rating1);
  const r2 = Number(rating2);
  if (isNaN(r1) || isNaN(r2) || r1 < 0 || r2 < 0) {
    return res.status(400).json({ error: 'Ratings must be valid non-negative numbers. Use 0 for unrated.' });
  }

  const registered = await getRegistrationCount();
  if (registered >= MAX_TEAMS) {
    return res.status(409).json({ error: 'Registration is full. All 70 slots have been taken.' });
  }

  await client.execute({
    sql: `INSERT INTO registrations (team_name, player1, player2, rating1, rating2, mobile)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [teamName.trim(), player1.trim(), player2.trim(), r1, r2, mobile.trim()],
  });

  const slotsRemaining = MAX_TEAMS - (registered + 1);
  res.status(201).json({ success: true, slotsRemaining });
});

// Admin auth helper
const requireAdmin = (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.query.key !== adminKey) {
    res.status(401).json({ error: 'Unauthorized.' });
    return false;
  }
  return true;
};

// GET /api/registrations?key=SECRET — view all registered teams
app.get('/api/registrations', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const result = await client.execute('SELECT * FROM registrations ORDER BY created_at DESC');
  res.json({ total: result.rows.length, teams: result.rows });
});

// PUT /api/registrations/:id?key=SECRET — update a registration
app.put('/api/registrations/:id', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { teamName, player1, player2, rating1, rating2, mobile } = req.body;
  const id = Number(req.params.id);

  if (!teamName?.trim() || !player1?.trim() || !player2?.trim() || !mobile?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const result = await client.execute({
    sql: `UPDATE registrations SET team_name=?, player1=?, player2=?, rating1=?, rating2=?, mobile=? WHERE id=?`,
    args: [teamName.trim(), player1.trim(), player2.trim(), Number(rating1), Number(rating2), mobile.trim(), id],
  });

  if (result.rowsAffected === 0) {
    return res.status(404).json({ error: 'Registration not found.' });
  }
  res.json({ success: true });
});

// DELETE /api/registrations/:id?key=SECRET — delete a registration
app.delete('/api/registrations/:id', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);

  const result = await client.execute({
    sql: 'DELETE FROM registrations WHERE id=?',
    args: [id],
  });

  if (result.rowsAffected === 0) {
    return res.status(404).json({ error: 'Registration not found.' });
  }
  res.json({ success: true });
});

// ── Tournament routes ────────────────────────────────────────────────────────

/**
 * Returns current standings for all teams.
 */
async function computeStandings() {
  const teamsResult = await client.execute(
    'SELECT * FROM registrations ORDER BY created_at ASC'
  );
  const teams = teamsResult.rows;

  const pairingsResult = await client.execute(
    'SELECT * FROM pairings ORDER BY created_at ASC'
  );
  const allPairings = pairingsResult.rows;

  return teams
    .map(t => ({
      ...t,
      score: computeScore(t.id, allPairings),
      gamesPlayed: allPairings.filter(
        p => p.result !== null && (p.team1_id === t.id || p.team2_id === t.id)
      ).length,
    }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : (b.rating1 + b.rating2) / 2 - (a.rating1 + a.rating2) / 2
    )
    .map((t, i) => ({ rank: i + 1, ...t }));
}

// GET /api/tournament/status — current tournament state (public)
app.get('/api/tournament/status', async (_req, res) => {
  const result = await client.execute(
    'SELECT * FROM rounds ORDER BY round_num DESC LIMIT 1'
  );
  if (result.rows.length === 0) {
    return res.json({ started: false });
  }
  const round = result.rows[0];
  res.json({
    started: true,
    currentRound: round.round_num,
    totalRounds: round.total_rounds,
    status: round.status,
    algorithm: round.algorithm ?? 'swiss',
  });
});

// POST /api/tournament/start?key=SECRET — start tournament, generate round 1
app.post('/api/tournament/start', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const algorithm = req.body.algorithm ?? 'swiss';
  if (!VALID_ALGORITHMS.includes(algorithm)) {
    return res.status(400).json({ error: `algorithm must be one of: ${VALID_ALGORITHMS.join(', ')}` });
  }

  const existing = await client.execute('SELECT COUNT(*) as c FROM rounds');
  if (Number(existing.rows[0].c) > 0) {
    return res.status(409).json({ error: 'Tournament already started.' });
  }

  const teamsResult = await client.execute(
    'SELECT * FROM registrations ORDER BY (rating1 + rating2) DESC'
  );
  const teams = teamsResult.rows;
  if (teams.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 registered teams to start.' });
  }

  // Round Robin: auto-calculate total rounds (N-1 for even, N for odd)
  let totalRounds;
  if (algorithm === 'roundrobin') {
    const n = teams.length;
    totalRounds = n % 2 === 0 ? n - 1 : n;
  } else {
    totalRounds = Number(req.body.totalRounds);
    if (!totalRounds || totalRounds < 1 || totalRounds > 20) {
      return res.status(400).json({ error: 'totalRounds must be 1–20.' });
    }
  }

  const roundResult = await client.execute({
    sql: 'INSERT INTO rounds (round_num, total_rounds, status, algorithm) VALUES (?, ?, ?, ?)',
    args: [1, totalRounds, 'open', algorithm],
  });
  const roundId = roundResult.lastInsertRowid;

  const pairings = buildPairings(algorithm, teams, [], 1);
  for (const p of pairings) {
    await client.execute({
      sql: 'INSERT INTO pairings (round_id, board_num, team1_id, team2_id, color1, result) VALUES (?, ?, ?, ?, ?, ?)',
      args: [roundId, p.board_num, p.team1_id, p.team2_id, p.color1, p.team2_id === null ? 'bye' : null],
    });
  }

  res.status(201).json({ success: true, round: 1, boards: pairings.length, totalRounds, algorithm });
});

// POST /api/tournament/rounds/:n/generate?key=SECRET — generate next round
app.post('/api/tournament/rounds/:n/generate', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const n = Number(req.params.n);

  const prevRound = await client.execute({
    sql: 'SELECT * FROM rounds WHERE round_num = ?',
    args: [n - 1],
  });
  if (prevRound.rows.length === 0) {
    return res.status(404).json({ error: `Round ${n - 1} does not exist.` });
  }

  const pending = await client.execute({
    sql: 'SELECT COUNT(*) as c FROM pairings WHERE round_id = ? AND result IS NULL',
    args: [prevRound.rows[0].id],
  });
  if (Number(pending.rows[0].c) > 0) {
    return res.status(409).json({
      error: `Round ${n - 1} has ${pending.rows[0].c} result(s) still pending.`,
    });
  }

  await client.execute({
    sql: "UPDATE rounds SET status = 'done' WHERE id = ?",
    args: [prevRound.rows[0].id],
  });

  const alreadyExists = await client.execute({
    sql: 'SELECT id FROM rounds WHERE round_num = ?',
    args: [n],
  });
  if (alreadyExists.rows.length > 0) {
    return res.status(409).json({ error: `Round ${n} already generated.` });
  }

  const totalRounds = prevRound.rows[0].total_rounds;
  const algorithm = prevRound.rows[0].algorithm ?? 'swiss';

  if (n > totalRounds) {
    return res.status(400).json({ error: 'Tournament is already complete.' });
  }

  const teamsResult = await client.execute(
    'SELECT * FROM registrations ORDER BY (rating1 + rating2) DESC'
  );
  const allPairingsResult = await client.execute(
    'SELECT * FROM pairings ORDER BY created_at ASC'
  );

  const roundResult = await client.execute({
    sql: 'INSERT INTO rounds (round_num, total_rounds, status, algorithm) VALUES (?, ?, ?, ?)',
    args: [n, totalRounds, 'open', algorithm],
  });
  const roundId = roundResult.lastInsertRowid;

  const pairings = buildPairings(algorithm, teamsResult.rows, allPairingsResult.rows, n);
  for (const p of pairings) {
    await client.execute({
      sql: 'INSERT INTO pairings (round_id, board_num, team1_id, team2_id, color1, result) VALUES (?, ?, ?, ?, ?, ?)',
      args: [roundId, p.board_num, p.team1_id, p.team2_id, p.color1, p.team2_id === null ? 'bye' : null],
    });
  }

  res.status(201).json({ success: true, round: n, boards: pairings.length });
});

// PUT /api/tournament/pairings/:id/result?key=SECRET — enter a result
app.put('/api/tournament/pairings/:id/result', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.params.id);
  const { result } = req.body;

  const allowed = ['1-0', '0-1', '1/2-1/2'];
  if (!allowed.includes(result)) {
    return res.status(400).json({ error: `result must be one of: ${allowed.join(', ')}` });
  }

  const pairing = await client.execute({
    sql: 'SELECT * FROM pairings WHERE id = ?',
    args: [id],
  });
  if (pairing.rows.length === 0) {
    return res.status(404).json({ error: 'Pairing not found.' });
  }
  if (pairing.rows[0].team2_id === null) {
    return res.status(400).json({ error: 'Cannot enter result for a bye.' });
  }

  await client.execute({
    sql: 'UPDATE pairings SET result = ? WHERE id = ?',
    args: [result, id],
  });

  res.json({ success: true });
});

// GET /api/tournament/rounds/:n — pairings for round N (public)
app.get('/api/tournament/rounds/:n', async (req, res) => {
  const n = Number(req.params.n);

  const roundResult = await client.execute({
    sql: 'SELECT * FROM rounds WHERE round_num = ?',
    args: [n],
  });
  if (roundResult.rows.length === 0) {
    return res.status(404).json({ error: `Round ${n} not found.` });
  }
  const round = roundResult.rows[0];

  const pairingsResult = await client.execute({
    sql: `SELECT p.*,
            t1.team_name as team1_name, t1.player1 as t1p1, t1.player2 as t1p2,
            t1.rating1 as t1r1, t1.rating2 as t1r2,
            t2.team_name as team2_name, t2.player1 as t2p1, t2.player2 as t2p2,
            t2.rating1 as t2r1, t2.rating2 as t2r2
          FROM pairings p
          JOIN registrations t1 ON p.team1_id = t1.id
          LEFT JOIN registrations t2 ON p.team2_id = t2.id
          WHERE p.round_id = ?
          ORDER BY p.board_num ASC`,
    args: [round.id],
  });

  res.json({
    round: round.round_num,
    totalRounds: round.total_rounds,
    status: round.status,
    pairings: pairingsResult.rows,
  });
});

// DELETE /api/tournament/reset?key=SECRET — wipe rounds + pairings, keep registrations
app.delete('/api/tournament/reset', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  await client.execute('DELETE FROM pairings');
  await client.execute('DELETE FROM rounds');
  res.json({ success: true });
});

// GET /api/tournament/standings — current standings (public)
app.get('/api/tournament/standings', async (_req, res) => {
  const standings = await computeStandings();
  res.json({ standings });
});

// SPA fallback — must be after API routes
if (!isDev) {
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
