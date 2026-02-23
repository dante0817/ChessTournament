import React, { useState } from 'react';
import { Trash2, Pencil, Save, X, LogIn, Shield, ArrowLeft, Download, Swords } from 'lucide-react';
import {
  fetchTournamentStatus,
  fetchRound,
  startTournament,
  generateNextRound,
  enterResult,
  resetTournament,
  TournamentStatus,
  RoundData,
} from '../services/api';

interface Registration {
  id: number;
  team_name: string;
  player1: string;
  player2: string;
  rating1: number;
  rating2: number;
  mobile: string;
  date_paid: string | null;
  amount_paid: number | null;
  paid_to: string | null;
  pay_method: string | null;
  manager: string | null;
  contact_no: string | null;
  created_at: string;
}

const Admin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [key, setKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [teams, setTeams] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Registration>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'registrations' | 'tournament'>('registrations');
  const [tournamentStatus, setTournamentStatus] = useState<TournamentStatus | null>(null);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [totalRoundsInput, setTotalRoundsInput] = useState('7');
  const [algorithmInput, setAlgorithmInput] = useState<'swiss' | 'roundrobin' | 'random'>('swiss');
  const [tError, setTError] = useState('');
  const [tLoading, setTLoading] = useState(false);

  const formatAmount = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `PHP ${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchTournamentData = async () => {
    setTLoading(true);
    setTError('');
    try {
      const s = await fetchTournamentStatus();
      setTournamentStatus(s);
      if (s.started && s.currentRound) {
        const rd = await fetchRound(s.currentRound);
        setRoundData(rd);
      } else {
        setRoundData(null);
      }
    } catch (err: unknown) {
      setTError(err instanceof Error ? err.message : 'Failed to load tournament data.');
    } finally {
      setTLoading(false);
    }
  };

  const fetchTeams = async (adminKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/registrations?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTeams(data.teams);
      setTotal(data.total);
      setAuthenticated(true);
      fetchTournamentData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeams(key);
  };

  const startEdit = (team: Registration) => {
    setEditingId(team.id);
    setEditData({
      team_name: team.team_name,
      player1: team.player1,
      player2: team.player2,
      rating1: team.rating1,
      rating2: team.rating2,
      mobile: team.mobile,
      date_paid: team.date_paid ?? '',
      amount_paid: team.amount_paid ?? null,
      paid_to: team.paid_to ?? '',
      pay_method: team.pay_method ?? '',
      manager: team.manager ?? '',
      contact_no: team.contact_no ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id: number) => {
    setError('');
    try {
      const res = await fetch(`/api/registrations/${id}?key=${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: editData.team_name,
          player1: editData.player1,
          player2: editData.player2,
          rating1: editData.rating1,
          rating2: editData.rating2,
          mobile: editData.mobile,
          datePaid: editData.date_paid,
          amountPaid: editData.amount_paid,
          paidTo: editData.paid_to,
          payMethod: editData.pay_method,
          manager: editData.manager,
          contactNo: editData.contact_no,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingId(null);
      fetchTeams(key);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const deleteTeam = async (id: number, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/registrations/${id}?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTeams(key);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const exportCSV = () => {
    const headers = [
      '#',
      'Team Name',
      'Player 1',
      'Rating 1',
      'Player 2',
      'Rating 2',
      'Ave Rating',
      'Mobile',
      'Date Paid',
      'Amount Paid',
      'Paid To',
      'Method',
      'Manager',
      'Contact Number',
      'Registered',
    ];
    const rows = teams.map((t, i) => [
      i + 1,
      `"${t.team_name}"`,
      `"${t.player1}"`,
      t.rating1,
      `"${t.player2}"`,
      t.rating2,
      ((t.rating1 + t.rating2) / 2).toFixed(1),
      `"${t.mobile}"`,
      `"${t.date_paid ?? ''}"`,
      t.amount_paid ?? '',
      `"${t.paid_to ?? ''}"`,
      `"${t.pay_method ?? ''}"`,
      `"${t.manager ?? ''}"`,
      `"${t.contact_no ?? ''}"`,
      `"${new Date(t.created_at).toLocaleString()}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chess-background px-4">
        <div className="panel w-full max-w-md p-7">
          <div className="mb-7 text-center">
            <div className="inline-flex rounded-full bg-chess-gold/20 p-3">
              <Shield className="h-7 w-7 text-chess-gold" />
            </div>
            <h1 className="section-title mt-3 text-3xl text-white">Admin Panel</h1>
            <p className="mt-2 text-sm muted-text">Enter your admin key to continue.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin key"
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-chess-cyan"
              autoFocus
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading || !key}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-chess-gold to-amber-500 px-4 py-3 font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Loading...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex w-full items-center justify-center gap-1 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chess-background text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="section-title text-3xl font-bold text-white">Tournament Admin</h1>
            <button onClick={onBack} className="mt-1 inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to site
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'registrations' && (
              <>
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => fetchTeams(key)}
                  className="rounded-lg bg-gradient-to-r from-chess-gold to-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                >
                  Refresh
                </button>
              </>
            )}
          </div>
        </header>

        <div className="mb-6 flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'registrations'
                ? 'bg-chess-gold text-slate-950'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Registrations ({total})
          </button>
          <button
            onClick={() => {
              setActiveTab('tournament');
              fetchTournamentData();
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'tournament'
                ? 'bg-chess-gold text-slate-950'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Swords className="h-4 w-4" />
            Tournament
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="space-y-5">
            <section className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1850px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/40 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Player 1</th>
                      <th className="px-4 py-3 text-center">R1</th>
                      <th className="px-4 py-3">Player 2</th>
                      <th className="px-4 py-3 text-center">R2</th>
                      <th className="px-4 py-3 text-center">Avg</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Date paid</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Paid to</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Manager</th>
                      <th className="px-4 py-3">Contact no.</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, i) => (
                      <tr key={team.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        {editingId === team.id ? (
                          <>
                            <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                            <td className="px-4 py-3">
                              <input
                                value={editData.team_name ?? ''}
                                onChange={(e) => setEditData((d) => ({ ...d, team_name: e.target.value }))}
                                className="w-full rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={editData.player1 ?? ''}
                                onChange={(e) => setEditData((d) => ({ ...d, player1: e.target.value }))}
                                className="w-full rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={editData.rating1 ?? 0}
                                onChange={(e) => setEditData((d) => ({ ...d, rating1: Number(e.target.value) }))}
                                className="w-20 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-center text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={editData.player2 ?? ''}
                                onChange={(e) => setEditData((d) => ({ ...d, player2: e.target.value }))}
                                className="w-full rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={editData.rating2 ?? 0}
                                onChange={(e) => setEditData((d) => ({ ...d, rating2: Number(e.target.value) }))}
                                className="w-20 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-center text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-chess-gold">
                              {(((editData.rating1 ?? 0) + (editData.rating2 ?? 0)) / 2).toFixed(1)}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={editData.mobile ?? ''}
                                onChange={(e) => setEditData((d) => ({ ...d, mobile: e.target.value }))}
                                className="w-full rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={String(editData.date_paid ?? '')}
                                onChange={(e) => setEditData((d) => ({ ...d, date_paid: e.target.value }))}
                                placeholder="Feb 22, 2026 - 6:13 PM (GMT+8)"
                                className="w-56 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editData.amount_paid ?? ''}
                                onChange={(e) =>
                                  setEditData((d) => ({
                                    ...d,
                                    amount_paid: e.target.value === '' ? null : Number(e.target.value),
                                  }))
                                }
                                className="w-28 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-right text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={String(editData.paid_to ?? '')}
                                onChange={(e) => setEditData((d) => ({ ...d, paid_to: e.target.value }))}
                                className="w-32 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={String(editData.pay_method ?? '')}
                                onChange={(e) => setEditData((d) => ({ ...d, pay_method: e.target.value }))}
                                className="w-28 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={String(editData.manager ?? '')}
                                onChange={(e) => setEditData((d) => ({ ...d, manager: e.target.value }))}
                                className="w-40 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={String(editData.contact_no ?? '')}
                                onChange={(e) => setEditData((d) => ({ ...d, contact_no: e.target.value }))}
                                className="w-40 rounded border border-white/15 bg-slate-950/60 px-2 py-1.5 text-white outline-none focus:border-chess-cyan"
                              />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{new Date(team.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => saveEdit(team.id)} className="p-1 text-emerald-300 transition hover:text-emerald-200" title="Save">
                                  <Save className="h-4 w-4" />
                                </button>
                                <button onClick={cancelEdit} className="p-1 text-slate-400 transition hover:text-white" title="Cancel">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                            <td className="px-4 py-3 font-semibold text-white">{team.team_name}</td>
                            <td className="px-4 py-3">{team.player1}</td>
                            <td className="px-4 py-3 text-center text-chess-gold">{team.rating1}</td>
                            <td className="px-4 py-3">{team.player2}</td>
                            <td className="px-4 py-3 text-center text-chess-gold">{team.rating2}</td>
                            <td className="px-4 py-3 text-center font-bold text-chess-gold">
                              {((team.rating1 + team.rating2) / 2).toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-slate-300">{team.mobile}</td>
                            <td className="px-4 py-3 text-slate-300">{team.date_paid || '-'}</td>
                            <td className="px-4 py-3 text-right text-chess-gold">{formatAmount(team.amount_paid)}</td>
                            <td className="px-4 py-3 text-slate-300">{team.paid_to || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">{team.pay_method || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">{team.manager || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">{team.contact_no || '-'}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{new Date(team.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => startEdit(team)} className="p-1 text-cyan-300 transition hover:text-cyan-200" title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => deleteTeam(team.id, team.team_name)} className="p-1 text-red-300 transition hover:text-red-200" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {teams.length === 0 && (
                      <tr>
                        <td colSpan={16} className="px-4 py-10 text-center text-slate-500">
                          No registrations yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        )}

        {activeTab === 'tournament' && (
          <section className="space-y-5">
            {tError && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-300">
                {tError}
              </div>
            )}

            {!tournamentStatus?.started && (
              <article className="panel p-6">
                <h2 className="section-title mb-4 flex items-center gap-2 text-xl text-white">
                  <Swords className="h-5 w-5 text-chess-gold" />
                  Start Tournament
                </h2>
                <div className="flex flex-wrap items-end gap-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Pairing algorithm
                    </span>
                    <select
                      value={algorithmInput}
                      onChange={(e) => setAlgorithmInput(e.target.value as typeof algorithmInput)}
                      className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white outline-none focus:border-chess-cyan"
                    >
                      <option value="swiss">Swiss (Dutch)</option>
                      <option value="roundrobin">Round Robin</option>
                      <option value="random">Random</option>
                    </select>
                  </label>
                  {algorithmInput !== 'roundrobin' ? (
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Total rounds
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={totalRoundsInput}
                        onChange={(e) => setTotalRoundsInput(e.target.value)}
                        className="w-24 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white outline-none focus:border-chess-cyan"
                      />
                    </label>
                  ) : (
                    <p className="pb-2 text-xs text-slate-400">Rounds auto-calculated from team count.</p>
                  )}
                  <button
                    disabled={tLoading}
                    onClick={async () => {
                      setTError('');
                      try {
                        await startTournament(key, Number(totalRoundsInput), algorithmInput);
                        fetchTournamentData();
                      } catch (err: unknown) {
                        setTError(err instanceof Error ? err.message : 'Failed to start tournament.');
                      }
                    }}
                    className="rounded-lg bg-gradient-to-r from-chess-gold to-amber-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {tLoading ? 'Starting...' : 'Generate Round 1'}
                  </button>
                </div>
              </article>
            )}

            {tournamentStatus?.started && roundData && (
              <article className="panel p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="section-title flex flex-wrap items-center gap-2 text-xl text-white">
                    <Swords className="h-5 w-5 text-chess-gold" />
                    Round {roundData.round} / {roundData.totalRounds}
                    {tournamentStatus.algorithm && (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-normal text-slate-300">
                        {({ swiss: 'Swiss', roundrobin: 'Round Robin', random: 'Random' }[tournamentStatus.algorithm] ??
                          tournamentStatus.algorithm)}
                      </span>
                    )}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={fetchTournamentData} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10">
                      Refresh
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Reset tournament? This deletes all rounds and pairings. Registrations are kept.')) return;
                        setTError('');
                        try {
                          await resetTournament(key);
                          setRoundData(null);
                          setTournamentStatus(null);
                          fetchTournamentData();
                        } catch (err: unknown) {
                          setTError(err instanceof Error ? err.message : 'Failed to reset tournament.');
                        }
                      }}
                      className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/10"
                    >
                      Reset
                    </button>
                    {roundData.status === 'open' && roundData.round < roundData.totalRounds && (
                      <button
                        disabled={tLoading || roundData.pairings.some((p) => p.team2_id !== null && p.result === null)}
                        onClick={async () => {
                          setTError('');
                          try {
                            await generateNextRound(key, roundData.round + 1);
                            fetchTournamentData();
                          } catch (err: unknown) {
                            setTError(err instanceof Error ? err.message : 'Failed to generate next round.');
                          }
                        }}
                        className="rounded-lg bg-gradient-to-r from-chess-gold to-amber-500 px-3 py-1.5 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        title="All results must be entered first"
                      >
                        Generate Round {roundData.round + 1}
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const pending = roundData.pairings.filter((p) => p.team2_id !== null && p.result === null).length;
                  return pending > 0 ? (
                    <p className="mb-3 text-xs font-semibold text-amber-300">{pending} result(s) pending</p>
                  ) : null;
                })()}

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-950/40 text-xs uppercase tracking-[0.16em] text-slate-400">
                        <th className="px-4 py-3 text-center">Board</th>
                        <th className="px-4 py-3 text-left">White</th>
                        <th className="px-4 py-3 text-center">Result</th>
                        <th className="px-4 py-3 text-left">Black</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundData.pairings.map((p) => {
                        const isBye = p.team2_id === null;
                        return (
                          <tr key={p.id} className="border-b border-white/5">
                            <td className="px-4 py-3 text-center font-bold text-chess-gold">{p.board_num}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-white">
                                {isBye ? p.team1_name : p.color1 === 'W' ? p.team1_name : p.team2_name ?? '-'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {isBye
                                  ? `${p.t1p1} / ${p.t1p2}`
                                  : p.color1 === 'W'
                                  ? `${p.t1p1} / ${p.t1p2}`
                                  : `${p.t2p1 ?? ''} / ${p.t2p2 ?? ''}`}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isBye ? (
                                <span className="text-xs font-bold uppercase tracking-wider text-chess-gold">Bye</span>
                              ) : (
                                <select
                                  value={p.result ?? ''}
                                  onChange={async (e) => {
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
                                  className={`rounded border px-2 py-1 text-sm outline-none ${
                                    p.result
                                      ? 'border-emerald-500/40 bg-emerald-900/20 text-emerald-300'
                                      : 'border-white/20 bg-slate-950/60 text-slate-300'
                                  }`}
                                >
                                  <option value="">Select</option>
                                  <option value="1-0">1-0</option>
                                  <option value="1/2-1/2">1/2-1/2</option>
                                  <option value="0-1">0-1</option>
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isBye ? (
                                <span className="text-sm italic text-slate-500">No opponent</span>
                              ) : (
                                <>
                                  <p className="font-semibold text-white">{p.color1 === 'W' ? p.team2_name ?? '-' : p.team1_name}</p>
                                  <p className="text-xs text-slate-500">
                                    {p.color1 === 'W' ? `${p.t2p1 ?? ''} / ${p.t2p2 ?? ''}` : `${p.t1p1} / ${p.t1p2}`}
                                  </p>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Admin;
