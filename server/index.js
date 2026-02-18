import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import client, { getRegistrationCount } from './db.js';

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

// SPA fallback — must be after API routes
if (!isDev) {
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
