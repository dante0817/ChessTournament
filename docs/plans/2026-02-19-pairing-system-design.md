# Swiss Pairing System — Design Document

**Date:** 2026-02-19
**Status:** Approved
**Approach:** Lightweight Built-in Swiss (Approach A)

---

## Overview

Add a full Swiss pairing system to the chess tournament app. The admin manages rounds and enters results; a public Pairings page shows current pairings and standings to all visitors.

---

## Database Schema

Two new tables added to the existing `registrations.db` (libsql/Turso):

```sql
-- One row per tournament round
CREATE TABLE IF NOT EXISTS rounds (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  round_num    INTEGER NOT NULL,
  total_rounds INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'done'
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One row per board matchup within a round
CREATE TABLE IF NOT EXISTS pairings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id   INTEGER NOT NULL REFERENCES rounds(id),
  board_num  INTEGER NOT NULL,
  team1_id   INTEGER NOT NULL REFERENCES registrations(id),
  team2_id   INTEGER,                          -- NULL = bye
  color1     TEXT DEFAULT NULL,                -- 'W' | 'B' (team1's color)
  result     TEXT DEFAULT NULL,               -- '1-0' | '0-1' | '1/2-1/2' | 'bye'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Cumulative scores are computed at query time from `pairings.result` — no separate score column needed.

---

## Swiss Pairing Algorithm (`server/swiss.js`)

Runs server-side when the admin generates a new round.

### Steps

1. **Compute standings**
   - For each registered team, tally points: win = 1, draw = 0.5, loss = 0, bye = 1.
   - Sort by score descending; break ties by seed rating (team average of player ratings, descending).

2. **Build history**
   - For each team, collect the set of all opponents already faced (from previous pairings).
   - Record each team's color in the last round they played.

3. **Pair by score groups (Dutch Swiss)**
   - Within each score group, pair 1st vs 2nd, 3rd vs 4th, etc.
   - If a pair has already played, try swapping within the group (backtracking one step).
   - If still unresolvable within the group, float the unpaired team down to the next score group.

4. **Color assignment**
   - Each team tracks their color history (last color played).
   - Assign colors to alternate: if team played White last round → Black this round.
   - If both teams in a pair "need" the same color, the higher-ranked team gets preference.
   - On Board 1, the higher-seeded team gets White in Round 1.

5. **Bye assignment**
   - If odd number of active teams, the lowest-ranked team that has not yet received a bye gets one.
   - A bye counts as a win (1 point) and is stored as `team2_id = NULL`, `result = 'bye'`.

6. **Board numbering**
   - Boards are numbered 1..N in descending score order (Board 1 = top match).

---

## API Endpoints

All admin endpoints require `?key=ADMIN_KEY` query parameter.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/tournament/start` | Admin | Start tournament: set `total_rounds`, generate Round 1 pairings |
| `POST` | `/api/tournament/rounds/:n/generate` | Admin | Generate pairings for round N (requires round N-1 to be fully scored) |
| `PUT` | `/api/tournament/pairings/:id/result` | Admin | Enter result for a board: `{ result: '1-0' \| '0-1' \| '1/2-1/2' }` |
| `GET` | `/api/tournament/rounds/:n` | Public | Pairings for a specific round (with team names, colors) |
| `GET` | `/api/tournament/standings` | Public | Current standings: rank, team, score, players, ave rating |
| `GET` | `/api/tournament/status` | Public | Current round number, total rounds, tournament state |

When all boards in a round have results, the round's `status` is automatically set to `'done'`.

---

## Frontend Components

### New public page — `components/Pairings.tsx`

Accessible via `window.location.hash === '#pairings'` (same pattern as `#admin`).

- **Round selector tabs** — Round 1, Round 2, … (up to current round)
- **Pairings table** per round:
  - Board # | White Team (players) | Black Team (players) | Result
  - Highlights the current round
- **Standings table** below:
  - Rank | Team Name | Players | Ave Rating | Score
- **Auto-refresh** every 30 seconds (or manual Refresh button)

### Updated `App.tsx`

Add `'pairings'` as a third page option alongside `'home'` and `'admin'`.

### Updated `components/Navbar.tsx`

Add a "Pairings" nav link pointing to `#pairings`.

### Updated `components/Admin.tsx`

Add a **Tournament tab** alongside the registrations table:

- **Start Tournament** section (shown when no rounds exist):
  - Input: Total Rounds (default 7)
  - Button: "Generate Round 1"
- **Current Round** section (once started):
  - Table: Board # | White Team | Black Team | Result dropdown (1-0, ½-½, 0-1)
  - Save Results button
  - Generate Next Round button (disabled until all results entered)
- Status indicator: "Round 3 of 7 — 4 results pending"

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `server/swiss.js` | Create — pairing algorithm |
| `server/db.js` | Modify — add `rounds` and `pairings` table creation |
| `server/index.js` | Modify — add tournament API routes |
| `components/Pairings.tsx` | Create — public pairings + standings page |
| `components/Admin.tsx` | Modify — add Tournament tab |
| `App.tsx` | Modify — add `'pairings'` page route |
| `components/Navbar.tsx` | Modify — add Pairings nav link |
| `services/api.ts` | Modify — add tournament API client functions |

---

## Error Handling

- Attempting to generate Round N before all Round N-1 results are entered → 409 error with message.
- Starting a tournament when one already exists → 409 error.
- Entering a result for a completed round → 403 error.
- Odd-team bye: always assigned to the lowest-ranked team that hasn't had a bye.

---

## Out of Scope (for now)

- Tiebreak display (Buchholz, Sonneborn-Berger) — standings show raw score only
- FIDE-grade pairing compliance
- Color violation rules (e.g., no more than 2 consecutive same-color games)
- Separate player-level pairings within a team (this is a team event)
