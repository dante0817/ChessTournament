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
