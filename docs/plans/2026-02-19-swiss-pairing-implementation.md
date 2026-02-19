# Swiss Pairing System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full Swiss tournament pairing system with result entry, public pairings page, and standings to the existing chess tournament app.

**Architecture:** Backend-first (DB schema → algorithm → API), then frontend (API client → components). No test runner is installed; verification is done via `curl` commands against the Express server and manual browser checks. Each task ends with a git commit.

**Tech Stack:** React 19 + TypeScript + Vite (frontend), Express 5 + libsql/Turso SQLite (backend), Tailwind CSS, Lucide icons.

---

## Task 1: Add DB Tables for Rounds and Pairings

**Files:**
- Modify: `server/db.js`

**Step 1: Read the current file**

Open `server/db.js`. It currently creates one table (`registrations`).

**Step 2: Add the two new table creation statements**

After the existing `CREATE TABLE IF NOT EXISTS registrations` block, append:

```js
await client.execute(`
  CREATE TABLE IF NOT EXISTS rounds (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    round_num    INTEGER NOT NULL,
    total_rounds INTEGER NOT NULL,
    status       TEXT NOT NULL DEFAULT 'open',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS pairings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id   INTEGER NOT NULL REFERENCES rounds(id),
    board_num  INTEGER NOT NULL,
    team1_id   INTEGER NOT NULL REFERENCES registrations(id),
    team2_id   INTEGER,
    color1     TEXT DEFAULT NULL,
    result     TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

**Step 3: Verify tables are created**

Run the server:
```bash
npm run server
```
Expected output: `Server running on http://localhost:3001` with no errors.

Optionally inspect the DB:
```bash
node -e "
import('@libsql/client').then(({ createClient }) => {
  const c = createClient({ url: 'file:registrations.db' });
  c.execute(\".tables\").then(r => console.log(r.rows));
});
"
```
Expected: `rounds` and `pairings` appear alongside `registrations`.

**Step 4: Commit**
```bash
git add server/db.js
git commit -m "feat: add rounds and pairings DB tables"
```

---

## Task 2: Swiss Pairing Algorithm Module

**Files:**
- Create: `server/swiss.js`

**Step 1: Understand the data shape going in**

The function receives:
- `teams`: array of `{ id, team_name, rating1, rating2 }` — all registered teams
- `prevPairings`: array of `{ team1_id, team2_id, result, color1 }` — all pairings from previous rounds

It returns:
- Array of `{ board_num, team1_id, team2_id, color1 }` — the new round's pairings

**Step 2: Create `server/swiss.js`**

```js
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
```

**Step 3: Smoke-test the algorithm in Node**

Run this quick check from the project root:
```bash
node --input-type=module <<'EOF'
import { generatePairings, computeScore } from './server/swiss.js';

const teams = [
  { id: 1, team_name: 'Alpha', rating1: 1900, rating2: 1850 },
  { id: 2, team_name: 'Beta',  rating1: 1800, rating2: 1750 },
  { id: 3, team_name: 'Gamma', rating1: 1700, rating2: 1650 },
  { id: 4, team_name: 'Delta', rating1: 1600, rating2: 1550 },
];
const pairings = generatePairings(teams, []);
console.log('Round 1 pairings:', JSON.stringify(pairings, null, 2));
EOF
```

Expected: 2 boards, team1_id has `color1: 'W'`, team2_id has the other color. No `null` team2_ids (even teams → no bye).

**Step 4: Commit**
```bash
git add server/swiss.js
git commit -m "feat: add Swiss pairing algorithm module"
```

---

## Task 3: Tournament API Routes

**Files:**
- Modify: `server/index.js`

**Step 1: Add the import at the top of server/index.js**

After the existing imports (line ~6), add:
```js
import { generatePairings, computeScore } from './swiss.js';
```

**Step 2: Add helper to compute standings from DB**

Add this function after the `requireAdmin` helper (~line 67):

```js
/**
 * Returns current standings for all teams.
 * Each entry: { id, team_name, player1, player2, rating1, rating2, score, gamesPlayed }
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
```

**Step 3: Add all tournament routes**

Add these routes to `server/index.js` after the existing admin DELETE route (~line 111), before the SPA fallback:

```js
// ── Tournament routes ────────────────────────────────────────────────────────

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
  });
});

// POST /api/tournament/start?key=SECRET — start tournament, generate round 1
app.post('/api/tournament/start', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const totalRounds = Number(req.body.totalRounds);
  if (!totalRounds || totalRounds < 1 || totalRounds > 20) {
    return res.status(400).json({ error: 'totalRounds must be 1–20.' });
  }

  // Check no rounds exist yet
  const existing = await client.execute('SELECT COUNT(*) as c FROM rounds');
  if (Number(existing.rows[0].c) > 0) {
    return res.status(409).json({ error: 'Tournament already started.' });
  }

  // Get all teams
  const teamsResult = await client.execute(
    'SELECT * FROM registrations ORDER BY (rating1 + rating2) DESC'
  );
  const teams = teamsResult.rows;
  if (teams.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 registered teams to start.' });
  }

  // Create round 1
  const roundResult = await client.execute({
    sql: 'INSERT INTO rounds (round_num, total_rounds, status) VALUES (?, ?, ?)',
    args: [1, totalRounds, 'open'],
  });
  const roundId = roundResult.lastInsertRowid;

  // Generate pairings
  const pairings = generatePairings(teams, []);
  for (const p of pairings) {
    await client.execute({
      sql: 'INSERT INTO pairings (round_id, board_num, team1_id, team2_id, color1, result) VALUES (?, ?, ?, ?, ?, ?)',
      args: [roundId, p.board_num, p.team1_id, p.team2_id, p.color1, p.team2_id === null ? 'bye' : null],
    });
  }

  res.status(201).json({ success: true, round: 1, boards: pairings.length });
});

// POST /api/tournament/rounds/:n/generate?key=SECRET — generate next round
app.post('/api/tournament/rounds/:n/generate', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const n = Number(req.params.n);

  // Check previous round exists and is complete
  const prevRound = await client.execute({
    sql: 'SELECT * FROM rounds WHERE round_num = ?',
    args: [n - 1],
  });
  if (prevRound.rows.length === 0) {
    return res.status(404).json({ error: `Round ${n - 1} does not exist.` });
  }

  const pending = await client.execute({
    sql: `SELECT COUNT(*) as c FROM pairings
          WHERE round_id = ? AND result IS NULL`,
    args: [prevRound.rows[0].id],
  });
  if (Number(pending.rows[0].c) > 0) {
    return res.status(409).json({
      error: `Round ${n - 1} has ${pending.rows[0].c} result(s) still pending.`,
    });
  }

  // Mark previous round done
  await client.execute({
    sql: "UPDATE rounds SET status = 'done' WHERE id = ?",
    args: [prevRound.rows[0].id],
  });

  // Check this round doesn't already exist
  const alreadyExists = await client.execute({
    sql: 'SELECT id FROM rounds WHERE round_num = ?',
    args: [n],
  });
  if (alreadyExists.rows.length > 0) {
    return res.status(409).json({ error: `Round ${n} already generated.` });
  }

  const totalRounds = prevRound.rows[0].total_rounds;
  if (n > totalRounds) {
    return res.status(400).json({ error: 'Tournament is already complete.' });
  }

  // Get all teams and all previous pairings
  const teamsResult = await client.execute(
    'SELECT * FROM registrations ORDER BY (rating1 + rating2) DESC'
  );
  const allPairingsResult = await client.execute(
    'SELECT * FROM pairings ORDER BY created_at ASC'
  );

  // Create round N
  const roundResult = await client.execute({
    sql: 'INSERT INTO rounds (round_num, total_rounds, status) VALUES (?, ?, ?)',
    args: [n, totalRounds, 'open'],
  });
  const roundId = roundResult.lastInsertRowid;

  const pairings = generatePairings(teamsResult.rows, allPairingsResult.rows);
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

  // Check pairing exists and is not a bye
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

// GET /api/tournament/standings — current standings (public)
app.get('/api/tournament/standings', async (_req, res) => {
  const standings = await computeStandings();
  res.json({ standings });
});
```

**Step 4: Verify with curl**

Start server: `npm run server`

```bash
# Status — no tournament yet
curl http://localhost:3001/api/tournament/status
# Expected: {"started":false}

# Start tournament (replace YOUR_ADMIN_KEY with the value from .env)
curl -X POST http://localhost:3001/api/tournament/start?key=YOUR_ADMIN_KEY \
  -H "Content-Type: application/json" \
  -d '{"totalRounds":7}'
# Expected: {"success":true,"round":1,"boards":N}

# View round 1 pairings
curl http://localhost:3001/api/tournament/rounds/1
# Expected: JSON with pairings array

# View standings
curl http://localhost:3001/api/tournament/standings
# Expected: JSON with standings array

# Enter a result (replace 1 with an actual pairing id from round 1)
curl -X PUT "http://localhost:3001/api/tournament/pairings/1/result?key=YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"result":"1-0"}'
# Expected: {"success":true}
```

**Step 5: Commit**
```bash
git add server/index.js
git commit -m "feat: add tournament API routes (start, generate rounds, results, standings)"
```

---

## Task 4: Tournament API Client (TypeScript)

**Files:**
- Modify: `services/api.ts`

**Step 1: Add interfaces and functions at the bottom of services/api.ts**

Append after the existing `fetchSlots` export:

```ts
// ── Tournament types ──────────────────────────────────────────────────────────

export interface TournamentStatus {
  started: boolean;
  currentRound?: number;
  totalRounds?: number;
  status?: 'open' | 'done';
}

export interface PairingRow {
  id: number;
  round_id: number;
  board_num: number;
  team1_id: number;
  team2_id: number | null;
  color1: 'W' | 'B' | null;
  result: string | null;
  // Joined fields
  team1_name: string;
  t1p1: string;
  t1p2: string;
  t1r1: number;
  t1r2: number;
  team2_name: string | null;
  t2p1: string | null;
  t2p2: string | null;
  t2r1: number | null;
  t2r2: number | null;
}

export interface RoundData {
  round: number;
  totalRounds: number;
  status: 'open' | 'done';
  pairings: PairingRow[];
}

export interface StandingRow {
  rank: number;
  id: number;
  team_name: string;
  player1: string;
  player2: string;
  rating1: number;
  rating2: number;
  score: number;
  gamesPlayed: number;
}

// ── Tournament API functions ──────────────────────────────────────────────────

export const fetchTournamentStatus = () =>
  request<TournamentStatus>('/api/tournament/status');

export const fetchRound = (n: number) =>
  request<RoundData>(`/api/tournament/rounds/${n}`);

export const fetchStandings = () =>
  request<{ standings: StandingRow[] }>('/api/tournament/standings');

export const startTournament = (adminKey: string, totalRounds: number) =>
  request<{ success: boolean; round: number; boards: number }>(
    `/api/tournament/start?key=${encodeURIComponent(adminKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalRounds }),
    }
  );

export const generateNextRound = (adminKey: string, n: number) =>
  request<{ success: boolean; round: number; boards: number }>(
    `/api/tournament/rounds/${n}/generate?key=${encodeURIComponent(adminKey)}`,
    { method: 'POST' }
  );

export const enterResult = (adminKey: string, pairingId: number, result: string) =>
  request<{ success: boolean }>(
    `/api/tournament/pairings/${pairingId}/result?key=${encodeURIComponent(adminKey)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    }
  );
```

**Step 2: Verify TypeScript compiles**
```bash
npm run build
```
Expected: no TypeScript errors.

**Step 3: Commit**
```bash
git add services/api.ts
git commit -m "feat: add tournament API client types and functions"
```

---

## Task 5: Public Pairings Page Component

**Files:**
- Create: `components/Pairings.tsx`

**Step 1: Create the component**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trophy, Users } from 'lucide-react';
import {
  fetchTournamentStatus,
  fetchRound,
  fetchStandings,
  TournamentStatus,
  RoundData,
  StandingRow,
} from '../services/api';

const Pairings: React.FC = () => {
  const [status, setStatus] = useState<TournamentStatus | null>(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (round?: number) => {
    setLoading(true);
    setError('');
    try {
      const s = await fetchTournamentStatus();
      setStatus(s);
      if (!s.started) { setLoading(false); return; }

      const r = round ?? s.currentRound ?? 1;
      setSelectedRound(r);

      const [rd, st] = await Promise.all([fetchRound(r), fetchStandings()]);
      setRoundData(rd);
      setStandings(st.standings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(selectedRound), 30_000);
    return () => clearInterval(interval);
  }, [loadData, selectedRound]);

  const handleRoundChange = (n: number) => {
    setSelectedRound(n);
    loadData(n);
  };

  const resultBadge = (result: string | null, isBye: boolean) => {
    if (isBye) return <span className="text-yellow-400 font-bold text-xs">BYE</span>;
    if (!result) return <span className="text-gray-500 text-xs">—</span>;
    const color = result === '1-0' ? 'text-green-400' : result === '0-1' ? 'text-red-400' : 'text-yellow-300';
    return <span className={`font-bold text-sm ${color}`}>{result}</span>;
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-chess-dark flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading tournament data…</p>
      </div>
    );
  }

  if (!status?.started) {
    return (
      <div className="min-h-screen bg-chess-dark flex flex-col items-center justify-center gap-4 text-center px-4">
        <Trophy className="h-16 w-16 text-chess-gold" />
        <h1 className="font-display text-3xl font-bold text-white">Tournament Not Started</h1>
        <p className="text-gray-400 max-w-sm">
          Pairings will appear here once the tournament director generates them.
          Check back on tournament day!
        </p>
      </div>
    );
  }

  const totalRounds = status.totalRounds ?? 1;
  const roundTabs = Array.from({ length: status.currentRound ?? 1 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-chess-dark text-white pb-16">
      {/* Header */}
      <div className="border-b border-chess-gold/20 bg-chess-dark/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">
            <span className="text-chess-gold">PAIRINGS</span>
            <span className="text-gray-400 text-sm ml-2 font-normal">
              Round {status.currentRound} of {totalRounds}
            </span>
          </h1>
          <button
            onClick={() => loadData(selectedRound)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {/* Round tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {roundTabs.map(n => (
            <button
              key={n}
              onClick={() => handleRoundChange(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold font-display shrink-0 transition-all ${
                selectedRound === n
                  ? 'bg-chess-gold text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              R{n}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Pairings table */}
        {roundData && (
          <div>
            <h2 className="font-display text-lg font-bold text-chess-gold mb-3">
              ROUND {roundData.round} PAIRINGS
              {roundData.status === 'done' && (
                <span className="ml-2 text-xs text-green-400 font-normal normal-case">✓ Complete</span>
              )}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                    <th className="py-3 px-4 text-center w-12">Board</th>
                    <th className="py-3 px-4 text-left">White</th>
                    <th className="py-3 px-4 text-center w-20">Result</th>
                    <th className="py-3 px-4 text-left">Black</th>
                  </tr>
                </thead>
                <tbody>
                  {roundData.pairings.map(p => {
                    const isBye = p.team2_id === null;
                    const whiteTeam = p.color1 === 'W' ? { name: p.team1_name, p1: p.t1p1, p2: p.t1p2 } : { name: p.team2_name ?? '', p1: p.t2p1 ?? '', p2: p.t2p2 ?? '' };
                    const blackTeam = p.color1 === 'W' ? { name: p.team2_name ?? 'BYE', p1: p.t2p1 ?? '', p2: p.t2p2 ?? '' } : { name: p.team1_name, p1: p.t1p1, p2: p.t1p2 };
                    return (
                      <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4 text-center text-chess-gold font-bold font-display">{p.board_num}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{isBye ? p.team1_name : whiteTeam.name}</div>
                          {!isBye && <div className="text-gray-500 text-xs">{whiteTeam.p1} / {whiteTeam.p2}</div>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {resultBadge(p.result, isBye)}
                        </td>
                        <td className="py-3 px-4">
                          {isBye ? (
                            <span className="text-gray-600 italic text-sm">— bye —</span>
                          ) : (
                            <>
                              <div className="font-bold text-white">{blackTeam.name}</div>
                              <div className="text-gray-500 text-xs">{blackTeam.p1} / {blackTeam.p2}</div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Standings table */}
        {standings.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-chess-gold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" /> STANDINGS
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                    <th className="py-3 px-4 text-center w-12">#</th>
                    <th className="py-3 px-4 text-left">Team</th>
                    <th className="py-3 px-4 text-left">Players</th>
                    <th className="py-3 px-4 text-center">Ave Rtg</th>
                    <th className="py-3 px-4 text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map(s => (
                    <tr key={s.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 text-center text-gray-500 font-bold">{s.rank}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.team_name}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{s.player1} / {s.player2}</td>
                      <td className="py-3 px-4 text-center text-chess-gold">
                        {((s.rating1 + s.rating2) / 2).toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-display text-white text-lg">
                        {s.score % 1 === 0 ? s.score : s.score.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pairings;
```

**Step 2: Verify it compiles**
```bash
npm run build
```
Expected: no errors.

**Step 3: Commit**
```bash
git add components/Pairings.tsx
git commit -m "feat: add public Pairings page component"
```

---

## Task 6: Add Tournament Tab to Admin Panel

**Files:**
- Modify: `components/Admin.tsx`

**Step 1: Add imports at the top of Admin.tsx**

Add to the existing import block:
```tsx
import {
  fetchTournamentStatus,
  fetchRound,
  startTournament,
  generateNextRound,
  enterResult,
  TournamentStatus,
  RoundData,
} from '../services/api';
import { Swords } from 'lucide-react';
```

**Step 2: Add tournament state variables**

Inside the `Admin` component, after the existing state declarations, add:
```tsx
const [activeTab, setActiveTab] = useState<'registrations' | 'tournament'>('registrations');
const [tournamentStatus, setTournamentStatus] = useState<TournamentStatus | null>(null);
const [roundData, setRoundData] = useState<RoundData | null>(null);
const [totalRoundsInput, setTotalRoundsInput] = useState('7');
const [tError, setTError] = useState('');
const [tLoading, setTLoading] = useState(false);
```

**Step 3: Add tournament data fetching function**

Add this after `fetchTeams`:
```tsx
const fetchTournamentData = async () => {
  setTLoading(true);
  setTError('');
  try {
    const s = await fetchTournamentStatus();
    setTournamentStatus(s);
    if (s.started && s.currentRound) {
      const rd = await fetchRound(s.currentRound);
      setRoundData(rd);
    }
  } catch (err: unknown) {
    setTError(err instanceof Error ? err.message : 'Failed to load tournament data.');
  } finally {
    setTLoading(false);
  }
};
```

**Step 4: Fetch tournament data on authentication**

In the existing `fetchTeams` function (after `setAuthenticated(true)`), add:
```tsx
fetchTournamentData();
```

**Step 5: Add tab bar to the authenticated admin header**

In the authenticated dashboard's header area (after the "Export CSV" and "Refresh" buttons div), add tab buttons:
```tsx
{/* Tab bar */}
<div className="flex gap-2 border-b border-gray-700 mb-6">
  <button
    onClick={() => setActiveTab('registrations')}
    className={`px-4 py-2 font-bold font-display text-sm transition-colors border-b-2 ${
      activeTab === 'registrations'
        ? 'border-chess-gold text-chess-gold'
        : 'border-transparent text-gray-400 hover:text-white'
    }`}
  >
    REGISTRATIONS
  </button>
  <button
    onClick={() => { setActiveTab('tournament'); fetchTournamentData(); }}
    className={`px-4 py-2 font-bold font-display text-sm transition-colors border-b-2 flex items-center gap-1 ${
      activeTab === 'tournament'
        ? 'border-chess-gold text-chess-gold'
        : 'border-transparent text-gray-400 hover:text-white'
    }`}
  >
    <Swords className="h-4 w-4" /> TOURNAMENT
  </button>
</div>
```

**Step 6: Wrap the existing table in a conditional**

Wrap the existing `<div className="overflow-x-auto rounded-xl ...">` table block with:
```tsx
{activeTab === 'registrations' && (
  // ... existing table JSX
)}
```

**Step 7: Add the Tournament tab content**

After the registrations table block, add:
```tsx
{activeTab === 'tournament' && (
  <div className="space-y-6">
    {tError && (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
        <p className="text-red-400 text-sm">{tError}</p>
      </div>
    )}

    {/* Start tournament (no rounds yet) */}
    {!tournamentStatus?.started && (
      <div className="bg-chess-charcoal rounded-xl border border-gray-700 p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Swords className="h-5 w-5 text-chess-gold" /> START TOURNAMENT
        </h2>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Total Rounds</label>
            <input
              type="number" min="1" max="20"
              value={totalRoundsInput}
              onChange={e => setTotalRoundsInput(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white w-24 focus:border-chess-gold focus:outline-none"
            />
          </div>
          <button
            disabled={tLoading}
            onClick={async () => {
              setTError('');
              try {
                await startTournament(key, Number(totalRoundsInput));
                fetchTournamentData();
              } catch (err: unknown) {
                setTError(err instanceof Error ? err.message : 'Failed to start tournament.');
              }
            }}
            className="bg-chess-gold hover:bg-yellow-400 disabled:opacity-60 text-black font-bold py-2 px-6 rounded-lg transition-all"
          >
            {tLoading ? 'Starting…' : 'Generate Round 1'}
          </button>
        </div>
      </div>
    )}

    {/* Current round result entry */}
    {tournamentStatus?.started && roundData && (
      <div className="bg-chess-charcoal rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Swords className="h-5 w-5 text-chess-gold" />
            ROUND {roundData.round} / {roundData.totalRounds}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => fetchTournamentData()}
              className="text-gray-400 hover:text-white text-sm"
            >
              Refresh
            </button>
            {roundData.status === 'open' && (
              <button
                disabled={tLoading || roundData.pairings.some(p => p.team2_id !== null && p.result === null)}
                onClick={async () => {
                  setTError('');
                  try {
                    await generateNextRound(key, roundData.round + 1);
                    fetchTournamentData();
                  } catch (err: unknown) {
                    setTError(err instanceof Error ? err.message : 'Failed to generate next round.');
                  }
                }}
                className="bg-chess-gold hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-1.5 px-4 rounded-lg text-sm transition-all"
                title="All results must be entered first"
              >
                Generate Round {roundData.round + 1}
              </button>
            )}
          </div>
        </div>

        {/* Pending count warning */}
        {(() => {
          const pending = roundData.pairings.filter(p => p.team2_id !== null && p.result === null).length;
          return pending > 0 ? (
            <p className="text-yellow-400 text-xs mb-3">{pending} result(s) still pending</p>
          ) : null;
        })()}

        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                <th className="py-3 px-4 text-center">Board</th>
                <th className="py-3 px-4 text-left">White</th>
                <th className="py-3 px-4 text-center">Result</th>
                <th className="py-3 px-4 text-left">Black</th>
              </tr>
            </thead>
            <tbody>
              {roundData.pairings.map(p => {
                const isBye = p.team2_id === null;
                return (
                  <tr key={p.id} className="border-t border-gray-800">
                    <td className="py-3 px-4 text-center text-chess-gold font-bold">{p.board_num}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold">{p.color1 === 'W' ? p.team1_name : (p.team2_name ?? '—')}</div>
                      <div className="text-gray-500 text-xs">
                        {p.color1 === 'W' ? `${p.t1p1} / ${p.t1p2}` : `${p.t2p1 ?? ''} / ${p.t2p2 ?? ''}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isBye ? (
                        <span className="text-yellow-400 text-xs font-bold">BYE</span>
                      ) : (
                        <select
                          value={p.result ?? ''}
                          onChange={async e => {
                            const val = e.target.value;
                            if (!val) return;
                            setTError('');
                            try {
                              await enterResult(key, p.id, val);
                              fetchTournamentData();
                            } catch (err: unknown) {
                              setTError(err instanceof Error ? err.message : 'Failed to save result.');
                            }
                          }}
                          className={`bg-gray-900 border rounded px-2 py-1 text-sm focus:outline-none ${
                            p.result ? 'border-green-700 text-green-400' : 'border-gray-600 text-gray-400'
                          }`}
                        >
                          <option value="">— select —</option>
                          <option value="1-0">1-0</option>
                          <option value="1/2-1/2">½-½</option>
                          <option value="0-1">0-1</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isBye ? (
                        <span className="text-gray-600 italic text-sm">— bye —</span>
                      ) : (
                        <>
                          <div className="font-bold">{p.color1 === 'W' ? (p.team2_name ?? '—') : p.team1_name}</div>
                          <div className="text-gray-500 text-xs">
                            {p.color1 === 'W' ? `${p.t2p1 ?? ''} / ${p.t2p2 ?? ''}` : `${p.t1p1} / ${p.t1p2}`}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)}
```

**Step 2: Verify it compiles**
```bash
npm run build
```
Expected: no TypeScript errors.

**Step 3: Commit**
```bash
git add components/Admin.tsx
git commit -m "feat: add Tournament tab to admin panel"
```

---

## Task 7: Wire Up Routing and Navigation

**Files:**
- Modify: `App.tsx`
- Modify: `components/Navbar.tsx`

**Step 1: Update App.tsx**

Add the `'pairings'` page option. Import `Pairings` and update the hash logic:

```tsx
// Add import:
import Pairings from './components/Pairings';

// Update page state:
const [page, setPage] = useState<'home' | 'admin' | 'pairings'>(
  window.location.hash === '#admin'
    ? 'admin'
    : window.location.hash === '#pairings'
    ? 'pairings'
    : 'home'
);

// Update hash handler:
const onHash = () =>
  setPage(
    window.location.hash === '#admin'
      ? 'admin'
      : window.location.hash === '#pairings'
      ? 'pairings'
      : 'home'
  );

// Add pairings branch before the home return:
if (page === 'pairings') {
  return <Pairings />;
}
```

**Step 2: Update Navbar.tsx**

Add a `Pairings` link to `navItems`:
```tsx
const navItems: NavItem[] = [
  { label: 'Details', href: '#details' },
  { label: 'Rules', href: '#rules' },
  { label: 'Prizes', href: '#prizes' },
  { label: 'Calculator', href: '#calculator' },
  { label: 'Registration', href: '#registration' },
  { label: 'Pairings', href: '#pairings' },
];
```

**Step 3: Verify end-to-end in browser**

Run full dev stack:
```bash
npm run dev:all
```

Check:
1. `http://localhost:3000` — home page loads normally
2. `http://localhost:3000/#pairings` — shows "Tournament Not Started" message
3. `http://localhost:3000/#admin` — admin panel shows, Tournament tab appears after login
4. Start tournament in admin, enter results, verify pairings page updates

**Step 4: Commit**
```bash
git add App.tsx components/Navbar.tsx
git commit -m "feat: add Pairings route and nav link"
```

---

## Done

All 7 tasks complete. The app now supports:
- Admin: start tournament (set rounds), view pairings, enter results per board, generate next round
- Public: view all round pairings and standings at `#pairings`
- Swiss algorithm: score groups, color alternation, bye assignment, rematch avoidance
