export interface RegistrationData {
  teamName: string;
  player1: string;
  player2: string;
  rating1: number;
  rating2: number;
  mobile: string;
}

export interface RegistrationResult {
  success: boolean;
  id: number;
  slotsRemaining: number;
}

export interface SlotsResult {
  registered: number;
  remaining: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export const submitRegistration = (data: RegistrationData) =>
  request<RegistrationResult>('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const fetchSlots = () => request<SlotsResult>('/api/slots');

// ── Tournament types ──────────────────────────────────────────────────────────

export interface TournamentStatus {
  started: boolean;
  currentRound?: number;
  totalRounds?: number;
  status?: 'open' | 'done';
  algorithm?: 'swiss' | 'roundrobin' | 'random';
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

export const startTournament = (adminKey: string, totalRounds: number, algorithm: string) =>
  request<{ success: boolean; round: number; boards: number; totalRounds: number; algorithm: string }>(
    `/api/tournament/start?key=${encodeURIComponent(adminKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalRounds, algorithm }),
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

export const resetTournament = (adminKey: string) =>
  request<{ success: boolean }>(
    `/api/tournament/reset?key=${encodeURIComponent(adminKey)}`,
    { method: 'DELETE' }
  );
