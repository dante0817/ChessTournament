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
      if (!s.started) {
        setLoading(false);
        return;
      }

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => loadData(selectedRound), 30_000);
    return () => clearInterval(interval);
  }, [loadData, selectedRound]);

  const handleRoundChange = (n: number) => {
    setSelectedRound(n);
    loadData(n);
  };

  const resultBadge = (result: string | null, isBye: boolean) => {
    if (isBye) return <span className="text-xs font-bold uppercase tracking-wider text-chess-gold">Bye</span>;
    if (!result) return <span className="text-xs text-slate-500">Pending</span>;
    const color =
      result === '1-0' ? 'text-emerald-300' : result === '0-1' ? 'text-red-300' : 'text-chess-gold';
    return <span className={`text-sm font-bold ${color}`}>{result}</span>;
  };

  if (loading && !status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chess-background">
        <p className="text-sm text-slate-400">Loading tournament data...</p>
      </div>
    );
  }

  if (!status?.started) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-chess-background px-4 text-center">
        <div className="rounded-full border border-white/10 bg-white/5 p-5">
          <Trophy className="h-10 w-10 text-chess-gold" />
        </div>
        <h1 className="section-title text-3xl font-bold text-white">Tournament Not Started</h1>
        <p className="max-w-md text-sm muted-text">
          Pairings and standings will appear here after the tournament director generates round 1.
        </p>
      </div>
    );
  }

  const totalRounds = status.totalRounds ?? 1;
  const roundTabs = Array.from({ length: status.currentRound ?? 1 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-chess-background pb-12 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-chess-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <a href="#" className="text-xs uppercase tracking-[0.18em] text-slate-400 transition hover:text-white">
              Back to event
            </a>
            <h1 className="section-title text-xl font-bold text-white">
              Public Pairings
              <span className="ml-2 text-sm font-normal text-slate-400">
                Round {status.currentRound} of {totalRounds}
              </span>
            </h1>
          </div>
          <button
            onClick={() => loadData(selectedRound)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          {roundTabs.map((n) => (
            <button
              key={n}
              onClick={() => handleRoundChange(n)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                selectedRound === n
                  ? 'bg-chess-gold text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Round {n}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {roundData && (
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="section-title text-lg text-white">Round {roundData.round} Pairings</h2>
              {roundData.status === 'done' && (
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  Complete
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/50 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-4 py-3 text-center">Board</th>
                    <th className="px-4 py-3 text-left">White</th>
                    <th className="px-4 py-3 text-center">Result</th>
                    <th className="px-4 py-3 text-left">Black</th>
                  </tr>
                </thead>
                <tbody>
                  {roundData.pairings.map((p) => {
                    const isBye = p.team2_id === null;
                    const whiteTeam =
                      p.color1 === 'W'
                        ? { name: p.team1_name, p1: p.t1p1, p2: p.t1p2 }
                        : { name: p.team2_name ?? '', p1: p.t2p1 ?? '', p2: p.t2p2 ?? '' };
                    const blackTeam =
                      p.color1 === 'W'
                        ? { name: p.team2_name ?? 'BYE', p1: p.t2p1 ?? '', p2: p.t2p2 ?? '' }
                        : { name: p.team1_name, p1: p.t1p1, p2: p.t1p2 };
                    return (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="px-4 py-3 text-center font-bold text-chess-gold">{p.board_num}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{isBye ? p.team1_name : whiteTeam.name}</p>
                          {!isBye && (
                            <p className="text-xs text-slate-500">
                              {whiteTeam.p1} / {whiteTeam.p2}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{resultBadge(p.result, isBye)}</td>
                        <td className="px-4 py-3">
                          {isBye ? (
                            <span className="text-sm italic text-slate-500">No opponent</span>
                          ) : (
                            <>
                              <p className="font-semibold text-white">{blackTeam.name}</p>
                              <p className="text-xs text-slate-500">
                                {blackTeam.p1} / {blackTeam.p2}
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
          </section>
        )}

        {standings.length > 0 && (
          <section className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <Users className="h-5 w-5 text-chess-cyan" />
              <h2 className="section-title text-lg text-white">Standings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/50 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-left">Players</th>
                    <th className="px-4 py-3 text-center">Avg</th>
                    <th className="px-4 py-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-center text-slate-500">{s.rank}</td>
                      <td className="px-4 py-3 font-semibold text-white">{s.team_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {s.player1} / {s.player2}
                      </td>
                      <td className="px-4 py-3 text-center text-chess-gold">
                        {((s.rating1 + s.rating2) / 2).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-center text-lg font-bold text-white">
                        {s.score % 1 === 0 ? s.score : s.score.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Pairings;
