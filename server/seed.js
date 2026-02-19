/**
 * Seed 20 dummy teams for local testing.
 * Run: node server/seed.js
 *
 * Flags:
 *   --clear   Wipe all registrations, rounds, and pairings first
 */
import client from './db.js';

const CLEAR = process.argv.includes('--clear');

const teams = [
  { team_name: 'Pasay Rooks',        player1: 'Carlos Reyes',    rating1: 2105, player2: 'Maria Santos',    rating2: 1980 },
  { team_name: 'Libertad Knights',   player1: 'Jose dela Cruz',  rating1: 2050, player2: 'Anna Villanueva', rating2: 1870 },
  { team_name: 'Baclaran Bishops',   player1: 'Ramon Garcia',    rating1: 1990, player2: 'Liza Flores',     rating2: 1820 },
  { team_name: 'Harrison Queens',    player1: 'Miguel Torres',   rating1: 1960, player2: 'Grace Mendoza',   rating2: 1750 },
  { team_name: 'Taft Pawns',         player1: 'Eduardo Cruz',    rating1: 1920, player2: 'Cynthia Lopez',   rating2: 1700 },
  { team_name: 'Vito Cruz Blitz',    player1: 'Antonio Reyes',   rating1: 1890, player2: 'Elena Ramos',     rating2: 1680 },
  { team_name: 'Quirino Gambiteers', player1: 'Roberto Lim',     rating1: 1850, player2: 'Patricia Tan',    rating2: 1640 },
  { team_name: 'MIA Road Masters',   player1: 'Fernando Ong',    rating1: 1820, player2: 'Cecilia Yu',      rating2: 1610 },
  { team_name: 'La Huerta Tactics',  player1: 'Leonardo Sy',     rating1: 1790, player2: 'Rosario Chua',    rating2: 1580 },
  { team_name: 'San Jose Captures',  player1: 'Vicente Go',      rating1: 1760, player2: 'Marilou Uy',      rating2: 1550 },
  { team_name: 'Malagasang Mates',   player1: 'Danilo Bautista', rating1: 1730, player2: 'Shirley Aquino',  rating2: 1520 },
  { team_name: 'Palanyag Pins',      player1: 'Ernesto Castro',  rating1: 1700, player2: 'Nenita Diaz',     rating2: 1490 },
  { team_name: 'Imus Checkmates',    player1: 'Alfredo Rivera',  rating1: 1670, player2: 'Teresita Morales',rating2: 1460 },
  { team_name: 'Bacoor Endgames',    player1: 'Bernardo Ocampo', rating1: 1640, player2: 'Josefina Perez',  rating2: 1430 },
  { team_name: 'Kawit Kings',        player1: 'Celestino Belen', rating1: 1610, player2: 'Remedios Aguilar',rating2: 1400 },
  { team_name: 'Cavite Killers',     player1: 'Domingo Velasco', rating1: 1580, player2: 'Esperanza Cortez',rating2: 1370 },
  { team_name: 'Noveleta Nimzo',     player1: 'Eulogio Navarro', rating1: 1550, player2: 'Felicidad Ramos', rating2: 1340 },
  { team_name: 'Rosario Sacrifices', player1: 'Florencio Soriano',rating1: 1520,player2: 'Gloria Fernandez',rating2: 1310 },
  { team_name: 'Naic Nightmares',    player1: 'Gregorio Jimenez',rating1: 1490, player2: 'Herminia Castro', rating2: 1280 },
  { team_name: 'Magallanes Mavericks',player1:'Honorio Castillo',rating1: 1460, player2: 'Imelda Ramos',    rating2: 1250 },
];

if (CLEAR) {
  console.log('Clearing all data...');
  await client.execute('DELETE FROM pairings');
  await client.execute('DELETE FROM rounds');
  await client.execute('DELETE FROM registrations');
  console.log('Done.');
}

console.log('Inserting 20 dummy teams...');
for (const t of teams) {
  await client.execute({
    sql: `INSERT INTO registrations (team_name, player1, player2, rating1, rating2, mobile)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [t.team_name, t.player1, t.player2, t.rating1, t.rating2, '09000000000'],
  });
}

const { rows } = await client.execute('SELECT COUNT(*) as count FROM registrations');
console.log(`Done. Total registrations: ${rows[0].count}`);
process.exit(0);
