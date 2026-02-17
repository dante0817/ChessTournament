import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// On Render, use the mounted disk at /data; locally fall back to project root
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'registrations.db');

const db = new Database(DB_PATH);

db.exec(`
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

export const getRegistrationCount = () => {
  return db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;
};

export default db;
