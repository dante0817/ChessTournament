import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { getRegistrationCount } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const MAX_TEAMS = 70;
const isDev = process.env.NODE_ENV !== 'production';

// In dev the Vite server runs separately; in prod Express serves the built frontend
if (isDev) {
  app.use(cors({ origin: 'http://localhost:3000' }));
} else {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}
app.use(express.json());

// GET /api/slots — current slot availability
app.get('/api/slots', (_req, res) => {
  const registered = getRegistrationCount();
  res.json({ registered, remaining: MAX_TEAMS - registered });
});

// POST /api/register — submit a team registration
app.post('/api/register', (req, res) => {
  const { teamName, player1, player2, rating1, rating2, mobile } = req.body;

  // Basic presence validation
  if (!teamName?.trim() || !player1?.trim() || !player2?.trim() || !mobile?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Mobile format: Philippine numbers (09XXXXXXXXX or +639XXXXXXXXX)
  if (!/^(\+63|0)9\d{9}$/.test(mobile.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Invalid mobile number. Use format: 09XX XXX XXXX.' });
  }

  const r1 = Number(rating1);
  const r2 = Number(rating2);
  if (isNaN(r1) || isNaN(r2) || r1 < 0 || r2 < 0) {
    return res.status(400).json({ error: 'Ratings must be valid non-negative numbers. Use 0 for unrated.' });
  }

  // Check slot availability
  const registered = getRegistrationCount();
  if (registered >= MAX_TEAMS) {
    return res.status(409).json({ error: 'Registration is full. All 70 slots have been taken.' });
  }

  const insert = db.prepare(`
    INSERT INTO registrations (team_name, player1, player2, rating1, rating2, mobile)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    teamName.trim(),
    player1.trim(),
    player2.trim(),
    r1,
    r2,
    mobile.trim()
  );

  const slotsRemaining = MAX_TEAMS - (registered + 1);
  res.status(201).json({ success: true, id: result.lastInsertRowid, slotsRemaining });
});

// SPA fallback — must be after API routes
if (!isDev) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
