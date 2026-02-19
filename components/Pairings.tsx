import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trophy, Users } from 'lucide-react';
import {
  fetchTournamentStatus,
  fetchRound,
  fetchStandings,
  TournamentStatus,
  RoundData,
  StandingRow,
} from '../services/api';

const Pairings: React.FC = () => {
  const [status, setStatus] = useState<TournamentStatus | null>(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (round?: number) => {
    setLoading(true);
    setError('');
    try {
      const s = await fetchTournamentStatus();
      setStatus(s);
      if (!s.started) { setLoading(false); return; }

      const r = round ?? s.currentRound ?? 1;
      setSelectedRound(r);

      const [rd, st] = await Promise.all([fetchRound(r), fetchStandings()]);
      setRoundData(rd);
      setStandings(st.standings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(selectedRound), 30_000);
    return () => clearInterval(interval);
  }, [loadData, selectedRound]);

  const handleRoundChange = (n: number) => {
    setSelectedRound(n);
    loadData(n);
  };

  const resultBadge = (result: string | null, isBye: boolean) => {
    if (isBye) return <span className="text-yellow-400 font-bold text-xs">BYE</span>;
    if (!result) return <span className="text-gray-500 text-xs">—</span>;
    const color = result === '1-0' ? 'text-green-400' : result === '0-1' ? 'text-red-400' : 'text-yellow-300';
    return <span className={`font-bold text-sm ${color}`}>{result}</span>;
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-chess-dark flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading tournament data…</p>
      </div>
    );
  }

  if (!status?.started) {
    return (
      <div className="min-h-screen bg-chess-dark flex flex-col items-center justify-center gap-4 text-center px-4">
        <Trophy className="h-16 w-16 text-chess-gold" />
        <h1 className="font-display text-3xl font-bold text-white">Tournament Not Started</h1>
        <p className="text-gray-400 max-w-sm">
          Pairings will appear here once the tournament director generates them.
          Check back on tournament day!
        </p>
      </div>
    );
  }

  const totalRounds = status.totalRounds ?? 1;
  const roundTabs = Array.from({ length: status.currentRound ?? 1 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-chess-dark text-white pb-16">
      {/* Header */}
      <div className="border-b border-chess-gold/20 bg-chess-dark/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">
            <span className="text-chess-gold">PAIRINGS</span>
            <span className="text-gray-400 text-sm ml-2 font-normal">
              Round {status.currentRound} of {totalRounds}
            </span>
          </h1>
          <button
            onClick={() => loadData(selectedRound)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {/* Round tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {roundTabs.map(n => (
            <button
              key={n}
              onClick={() => handleRoundChange(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold font-display shrink-0 transition-all ${
                selectedRound === n
                  ? 'bg-chess-gold text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              R{n}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Pairings table */}
        {roundData && (
          <div>
            <h2 className="font-display text-lg font-bold text-chess-gold mb-3">
              ROUND {roundData.round} PAIRINGS
              {roundData.status === 'done' && (
                <span className="ml-2 text-xs text-green-400 font-normal normal-case">✓ Complete</span>
              )}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                    <th className="py-3 px-4 text-center w-12">Board</th>
                    <th className="py-3 px-4 text-left">White</th>
                    <th className="py-3 px-4 text-center w-20">Result</th>
                    <th className="py-3 px-4 text-left">Black</th>
                  </tr>
                </thead>
                <tbody>
                  {roundData.pairings.map(p => {
                    const isBye = p.team2_id === null;
                    const whiteTeam = p.color1 === 'W'
                      ? { name: p.team1_name, p1: p.t1p1, p2: p.t1p2 }
                      : { name: p.team2_name ?? '', p1: p.t2p1 ?? '', p2: p.t2p2 ?? '' };
                    const blackTeam = p.color1 === 'W'
                      ? { name: p.team2_name ?? 'BYE', p1: p.t2p1 ?? '', p2: p.t2p2 ?? '' }
                      : { name: p.team1_name, p1: p.t1p1, p2: p.t1p2 };
                    return (
                      <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4 text-center text-chess-gold font-bold font-display">{p.board_num}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{isBye ? p.team1_name : whiteTeam.name}</div>
                          {!isBye && <div className="text-gray-500 text-xs">{whiteTeam.p1} / {whiteTeam.p2}</div>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {resultBadge(p.result, isBye)}
                        </td>
                        <td className="py-3 px-4">
                          {isBye ? (
                            <span className="text-gray-600 italic text-sm">— bye —</span>
                          ) : (
                            <>
                              <div className="font-bold text-white">{blackTeam.name}</div>
                              <div className="text-gray-500 text-xs">{blackTeam.p1} / {blackTeam.p2}</div>
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

        {/* Standings table */}
        {standings.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-chess-gold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" /> STANDINGS
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                    <th className="py-3 px-4 text-center w-12">#</th>
                    <th className="py-3 px-4 text-left">Team</th>
                    <th className="py-3 px-4 text-left">Players</th>
                    <th className="py-3 px-4 text-center">Ave Rtg</th>
                    <th className="py-3 px-4 text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map(s => (
                    <tr key={s.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 text-center text-gray-500 font-bold">{s.rank}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.team_name}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{s.player1} / {s.player2}</td>
                      <td className="py-3 px-4 text-center text-chess-gold">
                        {((s.rating1 + s.rating2) / 2).toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-display text-white text-lg">
                        {s.score % 1 === 0 ? s.score : s.score.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pairings;
