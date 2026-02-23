import React from 'react';
import { Medal, Trophy, Award } from 'lucide-react';
import { Prize, SpecialPrize } from '../types';

const mainPrizes: Prize[] = [
  { rank: 'Champion', amount: '15,000' },
  { rank: '2nd Place', amount: '10,000' },
  { rank: '3rd Place', amount: '7,000' },
  { rank: '4th Place', amount: '5,000' },
  { rank: '5th Place', amount: '3,000' },
  { rank: '6th Place', amount: '2,000' },
];

const specialPrizes: SpecialPrize[] = [
  { title: 'Top College', amount: '1,500' },
  { title: 'Top 1900', amount: '1,500' },
  { title: 'Top 1850', amount: '1,500' },
  { title: 'Consolation', amount: '1,500' },
  { title: 'Top Board 1', amount: '1,000' },
  { title: 'Top Board 2', amount: '1,000' },
];

const PrizeSection: React.FC = () => {
  return (
    <section id="prizes" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-chess-cyan">Payouts</p>
          <h2 className="section-title text-4xl font-bold text-white">Tournament Prizes</h2>
          <p className="mt-3 text-sm muted-text">Cash prizes are listed in PHP amounts.</p>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <article className="panel order-2 p-6 text-center md:order-1">
            <Medal className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 section-title text-2xl text-slate-100">{mainPrizes[1].rank}</h3>
            <p className="mt-2 text-4xl font-bold text-white">PHP {mainPrizes[1].amount}</p>
          </article>

          <article className="panel order-1 border-chess-gold/50 bg-gradient-to-b from-chess-gold/15 to-transparent p-6 text-center shadow-glow md:order-2 md:-translate-y-3">
            <div className="inline-flex rounded-full border border-chess-gold/40 bg-chess-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-chess-gold">
              Grand Prize
            </div>
            <Trophy className="mx-auto mt-4 h-16 w-16 text-chess-gold" />
            <h3 className="mt-3 section-title text-3xl text-chess-gold">{mainPrizes[0].rank}</h3>
            <p className="mt-2 text-5xl font-bold text-white">PHP {mainPrizes[0].amount}</p>
          </article>

          <article className="panel order-3 p-6 text-center">
            <Medal className="mx-auto h-12 w-12 text-amber-600" />
            <h3 className="mt-3 section-title text-2xl text-amber-400">{mainPrizes[2].rank}</h3>
            <p className="mt-2 text-4xl font-bold text-white">PHP {mainPrizes[2].amount}</p>
          </article>
        </div>

        <div className="mx-auto mb-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {mainPrizes.slice(3).map((prize) => (
            <article key={prize.rank} className="panel p-5 text-center">
              <p className="section-title text-lg text-slate-300">{prize.rank}</p>
              <p className="mt-1 text-2xl font-bold text-white">PHP {prize.amount}</p>
            </article>
          ))}
        </div>

        <div className="panel p-6">
          <h3 className="section-title text-2xl text-white">Special Category Awards</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {specialPrizes.map((prize) => (
              <article
                key={prize.title}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-chess-cyan" />
                  <span className="font-semibold text-slate-200">{prize.title}</span>
                </div>
                <span className="font-bold text-chess-gold">PHP {prize.amount}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrizeSection;
