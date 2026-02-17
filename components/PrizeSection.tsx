import React from 'react';
import { Medal, Trophy, Award } from 'lucide-react';
import { Prize, SpecialPrize } from '../types';

const mainPrizes: Prize[] = [
  { rank: 'CHAMPION', amount: '15,000', icon: 'trophy' },
  { rank: '2ND PLACE', amount: '10,000', icon: 'medal' },
  { rank: '3RD PLACE', amount: '7,000', icon: 'medal' },
  { rank: '4TH PLACE', amount: '5,000' },
  { rank: '5TH PLACE', amount: '3,000' },
  { rank: '6TH PLACE', amount: '2,000' },
];

const specialPrizes: SpecialPrize[] = [
  { title: 'TOP COLLEGE', amount: '1,500' },
  { title: 'TOP 1900', amount: '1,500' },
  { title: 'TOP 1850', amount: '1,500' },
  { title: 'CONSOLATION', amount: '1,500' },
  { title: 'TOP BOARD 1', amount: '1,000' },
  { title: 'TOP BOARD 2', amount: '1,000' },
];

const PrizeSection: React.FC = () => {
  return (
    <section id="prizes" className="py-20 bg-chess-charcoal relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            TOURNAMENT <span className="text-chess-gold">PRIZES</span>
          </h2>
          <div className="w-24 h-1 bg-chess-red mx-auto rounded"></div>
        </div>

        {/* Main Prizes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 2nd Place */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 text-center transform md:translate-y-4 hover:border-chess-gold transition-colors duration-300">
            <Medal className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-gray-300 mb-2">2ND PLACE</h3>
            <p className="font-display text-4xl font-bold text-white tracking-tight">₱10,000</p>
          </div>

          {/* Champion */}
          <div className="bg-gradient-to-b from-chess-gold/10 to-chess-gold/5 border border-chess-gold rounded-xl p-8 text-center transform md:-translate-y-4 shadow-[0_0_30px_rgba(242,201,76,0.15)] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2">
                <div className="bg-chess-red text-white text-xs font-bold px-2 py-1 rounded">GRAND PRIZE</div>
             </div>
            <Trophy className="h-20 w-20 text-chess-gold mx-auto mb-4" />
            <h3 className="font-display text-3xl text-chess-gold mb-2">CHAMPION</h3>
            <p className="font-display text-5xl font-bold text-white tracking-tight">₱15,000</p>
          </div>

          {/* 3rd Place */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 text-center transform md:translate-y-4 hover:border-chess-gold transition-colors duration-300">
            <Medal className="h-16 w-16 text-amber-700 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-amber-700 mb-2">3RD PLACE</h3>
            <p className="font-display text-4xl font-bold text-white tracking-tight">₱7,000</p>
          </div>
        </div>

        {/* Lower Main Prizes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 max-w-4xl mx-auto">
          {mainPrizes.slice(3).map((prize) => (
            <div key={prize.rank} className="bg-gray-800/50 p-6 rounded-lg text-center border border-gray-700">
              <h4 className="font-display text-xl text-gray-400">{prize.rank}</h4>
              <p className="font-display text-2xl font-bold text-white">₱{prize.amount}</p>
            </div>
          ))}
        </div>

        {/* Special Prizes */}
        <div className="max-w-5xl mx-auto">
          <h3 className="font-display text-2xl text-center text-white mb-8 border-b border-gray-800 pb-4">
            SPECIAL CATEGORY AWARDS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {specialPrizes.map((prize) => (
              <div key={prize.title} className="flex items-center justify-between bg-chess-dark p-4 rounded border border-gray-800 hover:border-chess-red/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-chess-red" />
                  <span className="font-display font-medium text-gray-300 text-sm md:text-base">{prize.title}</span>
                </div>
                <span className="font-display font-bold text-chess-gold">₱{prize.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrizeSection;