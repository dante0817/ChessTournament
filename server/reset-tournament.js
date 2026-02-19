/**
 * Reset tournament state (rounds + pairings) without touching registrations.
 * Use this to re-run the tournament from scratch with the same teams.
 * Run: node server/reset-tournament.js
 */
import client from './db.js';

console.log('Resetting tournament data...');
await client.execute('DELETE FROM pairings');
await client.execute('DELETE FROM rounds');
console.log('Done. Registrations are untouched.');
process.exit(0);
