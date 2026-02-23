import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle, XCircle } from 'lucide-react';

const RatingCalculator: React.FC = () => {
  const [player1, setPlayer1] = useState<number | string>('');
  const [player2, setPlayer2] = useState<number | string>('');
  const [average, setAverage] = useState<number>(0);
  const [eligible, setEligible] = useState<boolean>(true);

  const normalizeRating = (ratingStr: string | number): number => {
    if (ratingStr === '') return 0;
    const rating = Number(ratingStr);
    if (Number.isNaN(rating)) return 1800;
    if (rating < 1800) return 1800;
    return rating;
  };

  useEffect(() => {
    const r1 = normalizeRating(player1);
    const r2 = normalizeRating(player2);

    if (player1 === '' && player2 === '') {
      setAverage(0);
      return;
    }

    const avg = (r1 + r2) / 2;
    setAverage(avg);
    setEligible(avg <= 1975);
  }, [player1, player2]);

  return (
    <section id="calculator" className="py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="panel p-7 sm:p-9">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-chess-cyan/15 p-3">
              <Calculator className="h-7 w-7 text-chess-cyan" />
            </div>
            <h2 className="section-title mt-4 text-3xl font-bold text-white">Team Rating Checker</h2>
            <p className="mt-2 text-sm muted-text">
              Enter both ratings to verify if your team is eligible (max average: 1975).
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ratings below 1800 are automatically treated as 1800.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Player 1 rating
              </span>
              <input
                type="number"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                placeholder="e.g. 1950"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-chess-cyan"
              />
              <span className="mt-1 block text-right text-xs text-slate-500">
                Calc value: {normalizeRating(player1)}
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Player 2 rating
              </span>
              <input
                type="number"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                placeholder="e.g. 1800"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-chess-cyan"
              />
              <span className="mt-1 block text-right text-xs text-slate-500">
                Calc value: {normalizeRating(player2)}
              </span>
            </label>
          </div>

          <div
            className={`mt-7 flex items-center justify-between rounded-xl border p-5 ${
              eligible ? 'border-emerald-600/40 bg-emerald-900/20' : 'border-red-600/40 bg-red-900/20'
            }`}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Team average</p>
              <p className={`mt-1 text-4xl font-bold ${eligible ? 'text-emerald-300' : 'text-red-300'}`}>
                {average > 0 ? average.toFixed(1) : '--'}
              </p>
            </div>
            {average > 0 && (
              <div className="flex items-center gap-3">
                <p className={`text-lg font-bold uppercase ${eligible ? 'text-emerald-300' : 'text-red-300'}`}>
                  {eligible ? 'Qualified' : 'Too High'}
                </p>
                {eligible ? (
                  <CheckCircle className="h-9 w-9 text-emerald-300" />
                ) : (
                  <XCircle className="h-9 w-9 text-red-300" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RatingCalculator;
