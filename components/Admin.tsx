import React, { useState, useEffect } from 'react';
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

  const fetchTournamentData = async () => {
    setTLoading(true);
    setTError('');
    try {
      const s = await fetchTournamentStatus();
      setTournamentStatus(s);
      if (s.started && s.currentRound) {
        const rd = await fetchRound(s.currentRound);
        setRoundData(rd);
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
    const headers = ['#', 'Team Name', 'Player 1', 'Rating 1', 'Player 2', 'Rating 2', 'Ave Rating', 'Mobile', 'Registered'];
    const rows = teams.map((t, i) => [
      i + 1,
      `"${t.team_name}"`,
      `"${t.player1}"`,
      t.rating1,
      `"${t.player2}"`,
      t.rating2,
      ((t.rating1 + t.rating2) / 2).toFixed(1),
      `"${t.mobile}"`,
      `"${new Date(t.created_at).toLocaleString()}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-chess-dark flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-chess-gold mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold text-white">ADMIN PANEL</h1>
            <p className="text-gray-400 mt-2 text-sm">Enter your admin key to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Admin Key"
              className="w-full bg-gray-900 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none border border-gray-700 focus:border-chess-gold transition-all"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !key}
              className="w-full bg-chess-gold hover:bg-yellow-400 disabled:opacity-60 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Loading...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full text-gray-400 hover:text-white text-sm flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to site
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-chess-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              <span className="text-chess-gold">ADMIN</span>
            </h1>
            <button onClick={onBack} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mt-1">
              <ArrowLeft className="h-3 w-3" /> Back to site
            </button>
          </div>
          <div className="flex gap-3">
            {activeTab === 'registrations' && (
              <>
                <button
                  onClick={exportCSV}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
                <button
                  onClick={() => fetchTeams(key)}
                  className="bg-chess-gold hover:bg-yellow-400 text-black text-sm font-bold py-2 px-4 rounded-lg transition-all"
                >
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2 font-bold font-display text-sm transition-colors border-b-2 ${
              activeTab === 'registrations'
                ? 'border-chess-gold text-chess-gold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            REGISTRATIONS ({total})
          </button>
          <button
            onClick={() => { setActiveTab('tournament'); fetchTournamentData(); }}
            className={`px-4 py-2 font-bold font-display text-sm transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'tournament'
                ? 'border-chess-gold text-chess-gold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="h-4 w-4" /> TOURNAMENT
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Registrations table */}
        {activeTab === 'registrations' && <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                <th className="py-3 px-4 text-left">#</th>
                <th className="py-3 px-4 text-left">Team Name</th>
                <th className="py-3 px-4 text-left">Player 1</th>
                <th className="py-3 px-4 text-center">R1</th>
                <th className="py-3 px-4 text-left">Player 2</th>
                <th className="py-3 px-4 text-center">R2</th>
                <th className="py-3 px-4 text-center">Ave</th>
                <th className="py-3 px-4 text-left">Mobile</th>
                <th className="py-3 px-4 text-left">Registered</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr key={team.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                  {editingId === team.id ? (
                    <>
                      <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                      <td className="py-3 px-4">
                        <input
                          value={editData.team_name ?? ''}
                          onChange={e => setEditData(d => ({ ...d, team_name: e.target.value }))}
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-full text-white focus:border-chess-gold focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          value={editData.player1 ?? ''}
                          onChange={e => setEditData(d => ({ ...d, player1: e.target.value }))}
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-full text-white focus:border-chess-gold focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={editData.rating1 ?? 0}
                          onChange={e => setEditData(d => ({ ...d, rating1: Number(e.target.value) }))}
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-16 text-center text-white focus:border-chess-gold focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          value={editData.player2 ?? ''}
                          onChange={e => setEditData(d => ({ ...d, player2: e.target.value }))}
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-full text-white focus:border-chess-gold focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={editData.rating2 ?? 0}
                          onChange={e => setEditData(d => ({ ...d, rating2: Number(e.target.value) }))}
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-16 text-center text-white focus:border-chess-gold focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-center text-yellow-400 font-bold">
                        {(((editData.rating1 ?? 0) + (editData.rating2 ?? 0)) / 2).toFixed(1)}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          value={editData.mobile ?? ''}
                          onChange={e => setEditData(d => ({ ...d, mobile: e.target.value }))}
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-full text-white focus:border-chess-gold focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {new Date(team.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => saveEdit(team.id)} className="text-green-400 hover:text-green-300 p-1" title="Save">
                            <Save className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-white p-1" title="Cancel">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                      <td className="py-3 px-4 font-bold">{team.team_name}</td>
                      <td className="py-3 px-4">{team.player1}</td>
                      <td className="py-3 px-4 text-center text-chess-gold">{team.rating1}</td>
                      <td className="py-3 px-4">{team.player2}</td>
                      <td className="py-3 px-4 text-center text-chess-gold">{team.rating2}</td>
                      <td className="py-3 px-4 text-center text-yellow-400 font-bold">{((team.rating1 + team.rating2) / 2).toFixed(1)}</td>
                      <td className="py-3 px-4 text-gray-400">{team.mobile}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {new Date(team.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => startEdit(team)} className="text-blue-400 hover:text-blue-300 p-1" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteTeam(team.id, team.team_name)} className="text-red-400 hover:text-red-300 p-1" title="Delete">
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
                  <td colSpan={10} className="py-12 text-center text-gray-500">No registrations yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>}

        {/* Tournament tab */}
        {activeTab === 'tournament' && (
          <div className="space-y-6">
            {tError && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm">{tError}</p>
              </div>
            )}

            {/* Start tournament */}
            {!tournamentStatus?.started && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Swords className="h-5 w-5 text-chess-gold" /> START TOURNAMENT
                </h2>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pairing Algorithm</label>
                    <select
                      value={algorithmInput}
                      onChange={e => setAlgorithmInput(e.target.value as typeof algorithmInput)}
                      className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:border-chess-gold focus:outline-none"
                    >
                      <option value="swiss">Swiss (Dutch)</option>
                      <option value="roundrobin">Round Robin</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                  {algorithmInput !== 'roundrobin' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Total Rounds</label>
                      <input
                        type="number" min="1" max="20"
                        value={totalRoundsInput}
                        onChange={e => setTotalRoundsInput(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white w-24 focus:border-chess-gold focus:outline-none"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pb-2">
                      Rounds auto-calculated from team count
                    </p>
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
                    className="bg-chess-gold hover:bg-yellow-400 disabled:opacity-60 text-black font-bold py-2 px-6 rounded-lg transition-all"
                  >
                    {tLoading ? 'Starting…' : 'Generate Round 1'}
                  </button>
                </div>
              </div>
            )}

            {/* Current round result entry */}
            {tournamentStatus?.started && roundData && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                    <Swords className="h-5 w-5 text-chess-gold" />
                    ROUND {roundData.round} / {roundData.totalRounds}
                    {tournamentStatus?.algorithm && (
                      <span className="text-xs font-normal text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                        {{swiss:'Swiss', roundrobin:'Round Robin', random:'Random'}[tournamentStatus.algorithm] ?? tournamentStatus.algorithm}
                      </span>
                    )}
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => fetchTournamentData()}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Reset tournament? This will delete all rounds and pairings. Registrations are kept.')) return;
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
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Reset
                    </button>
                    {roundData.status === 'open' && roundData.round < roundData.totalRounds && (
                      <button
                        disabled={tLoading || roundData.pairings.some(p => p.team2_id !== null && p.result === null)}
                        onClick={async () => {
                          setTError('');
                          try {
                            await generateNextRound(key, roundData.round + 1);
                            fetchTournamentData();
                          } catch (err: unknown) {
                            setTError(err instanceof Error ? err.message : 'Failed to generate next round.');
                          }
                        }}
                        className="bg-chess-gold hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-1.5 px-4 rounded-lg text-sm transition-all"
                        title="All results must be entered first"
                      >
                        Generate Round {roundData.round + 1}
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const pending = roundData.pairings.filter(p => p.team2_id !== null && p.result === null).length;
                  return pending > 0 ? (
                    <p className="text-yellow-400 text-xs mb-3">{pending} result(s) still pending</p>
                  ) : null;
                })()}

                <div className="overflow-x-auto rounded-xl border border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                        <th className="py-3 px-4 text-center">Board</th>
                        <th className="py-3 px-4 text-left">White</th>
                        <th className="py-3 px-4 text-center">Result</th>
                        <th className="py-3 px-4 text-left">Black</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundData.pairings.map(p => {
                        const isBye = p.team2_id === null;
                        return (
                          <tr key={p.id} className="border-t border-gray-800">
                            <td className="py-3 px-4 text-center text-chess-gold font-bold">{p.board_num}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold">
                                {isBye ? p.team1_name : (p.color1 === 'W' ? p.team1_name : (p.team2_name ?? '—'))}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {isBye ? `${p.t1p1} / ${p.t1p2}` : (p.color1 === 'W' ? `${p.t1p1} / ${p.t1p2}` : `${p.t2p1 ?? ''} / ${p.t2p2 ?? ''}`)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isBye ? (
                                <span className="text-yellow-400 text-xs font-bold">BYE</span>
                              ) : (
                                <select
                                  value={p.result ?? ''}
                                  onChange={async e => {
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
                                  className={`bg-gray-900 border rounded px-2 py-1 text-sm focus:outline-none ${
                                    p.result ? 'border-green-700 text-green-400' : 'border-gray-600 text-gray-400'
                                  }`}
                                >
                                  <option value="">— select —</option>
                                  <option value="1-0">1-0</option>
                                  <option value="1/2-1/2">½-½</option>
                                  <option value="0-1">0-1</option>
                                </select>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isBye ? (
                                <span className="text-gray-600 italic text-sm">— bye —</span>
                              ) : (
                                <>
                                  <div className="font-bold">{p.color1 === 'W' ? (p.team2_name ?? '—') : p.team1_name}</div>
                                  <div className="text-gray-500 text-xs">
                                    {p.color1 === 'W' ? `${p.t2p1 ?? ''} / ${p.t2p2 ?? ''}` : `${p.t1p1} / ${p.t1p2}`}
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
