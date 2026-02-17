import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle, XCircle } from 'lucide-react';

const RatingCalculator: React.FC = () => {
  const [player1, setPlayer1] = useState<number | string>('');
  const [player2, setPlayer2] = useState<number | string>('');
  const [average, setAverage] = useState<number>(0);
  const [eligible, setEligible] = useState<boolean>(true);

  // Helper to normalize rating (apply the 1800 floor rule)
  const normalizeRating = (ratingStr: string | number): number => {
    if (ratingStr === '') return 0;
    const r = Number(ratingStr);
    if (isNaN(r)) return 1800; // Treat invalid/unrated as 1800 based on "Unrated considered 1800"
    if (r < 1800) return 1800; // 1799 Below considered 1800
    return r;
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
    <section id="calculator" className="py-20 bg-chess-charcoal border-y border-gray-800">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-chess-gold/10 rounded-full mb-4">
            <Calculator className="h-8 w-8 text-chess-gold" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white">TEAM RATING <span className="text-chess-gold">CHECKER</span></h2>
          <p className="text-gray-400 mt-2">Enter ratings to check if your team qualifies (Max Avg: 1975)</p>
          <p className="text-xs text-gray-500 mt-1">Note: Ratings below 1800 automatically calculated as 1800.</p>
        </div>

        <div className="bg-chess-dark p-8 rounded-xl border border-gray-700 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Player 1 Rating</label>
              <input
                type="number"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                placeholder="e.g. 1950"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-chess-gold focus:ring-1 focus:ring-chess-gold transition-colors"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                Calc Value: {normalizeRating(player1)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Player 2 Rating</label>
              <input
                type="number"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                placeholder="e.g. 1800"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-chess-gold focus:ring-1 focus:ring-chess-gold transition-colors"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                Calc Value: {normalizeRating(player2)}
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border flex items-center justify-between ${eligible ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wider">Team Average</p>
              <p className={`font-display text-4xl font-bold ${eligible ? 'text-green-400' : 'text-red-400'}`}>
                {average > 0 ? average.toFixed(1) : '--'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {average > 0 && (
                <>
                    <span className={`font-display text-xl font-bold ${eligible ? 'text-green-400' : 'text-red-400'}`}>
                        {eligible ? 'QUALIFIED' : 'TOO HIGH'}
                    </span>
                    {eligible ? <CheckCircle className="h-10 w-10 text-green-500" /> : <XCircle className="h-10 w-10 text-red-500" />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RatingCalculator;