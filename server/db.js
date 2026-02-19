import { createClient } from '@libsql/client';

const client = createClient({
  // Locally: uses a local SQLite file (no Turso account needed)
  // Production: set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars
  url: process.env.TURSO_DATABASE_URL || 'file:registrations.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute(`
  CREATE TABLE IF NOT EXISTS registrations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name   TEXT    NOT NULL,
    player1     TEXT    NOT NULL,
    player2     TEXT    NOT NULL,
    rating1     INTEGER NOT NULL,
    rating2     INTEGER NOT NULL,
    mobile      TEXT    NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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

// Migration: add algorithm column to existing rounds tables
try {
  await client.execute("ALTER TABLE rounds ADD COLUMN algorithm TEXT NOT NULL DEFAULT 'swiss'");
} catch (_) {
  // Column already exists — safe to ignore
}

export const getRegistrationCount = async () => {
  const result = await client.execute('SELECT COUNT(*) as count FROM registrations');
  return Number(result.rows[0].count);
};

export default client;
