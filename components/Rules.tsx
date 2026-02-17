import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Scroll, Gavel, Users, ShieldAlert, Swords } from 'lucide-react';

interface RuleItemProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const RuleItem: React.FC<RuleItemProps> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-800 rounded-xl bg-chess-charcoal overflow-hidden transition-all duration-300 hover:border-chess-gold/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-chess-charcoal to-chess-dark hover:from-gray-800 hover:to-gray-900 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-chess-red text-white' : 'bg-gray-800 text-chess-gold'}`}>
            {icon}
          </div>
          <h3 className="font-display text-lg md:text-xl text-white tracking-wide uppercase text-left">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="text-chess-red" /> : <ChevronDown className="text-gray-500" />}
      </button>
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-6 py-6 border-t border-gray-800 bg-black/20 text-gray-300 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
};

const Rules: React.FC = () => {
  return (
    <section id="rules" className="py-24 bg-zinc-950 relative border-t border-gray-900">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
       <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              TOURNAMENT <span className="text-chess-red">RULES</span>
            </h2>
            <div className="h-1 w-24 bg-chess-gold mx-auto rounded-full mb-6"></div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Ensure fair play and competitive integrity. Please read the official regulations for the Grudge Match II.
            </p>
          </div>

          <div className="space-y-4">
            <RuleItem title="Team Eligibility & Composition" icon={<Users className="w-5 h-5"/>} defaultOpen={true}>
               <ul className="list-disc pl-5 space-y-3 marker:text-chess-red">
                 <li>Strictly for <strong>Non-Master</strong> players only.</li>
                 <li>Each team is composed of <strong>2 players</strong>.</li>
                 <li>Combined Team Average Rating must not exceed <strong>1975</strong>.</li>
                 <li>Ratings are based on the latest NCFP/FIDE Local Ratings as of February 2026.</li>
                 <li><strong>Rating Floor Rule:</strong> Players with ratings 1799 & below, and Unrated players, are automatically calculated as <strong>1800</strong>.</li>
               </ul>
            </RuleItem>
            
            <RuleItem title="Pairing System & Time Control" icon={<Swords className="w-5 h-5"/>}>
               <ul className="list-disc pl-5 space-y-3 marker:text-chess-gold">
                 <li><strong>Format:</strong> 7-Round Swiss System.</li>
                 <li><strong>Time Control:</strong> 15 Minutes + 3 Seconds increment per move (Rapid).</li>
                 <li><strong>Pairing Software:</strong> Official Swiss Manager pairing program will be used.</li>
                 <li><strong>Default Time:</strong> Players who arrive 10 minutes after the start of the round will be forfeited.</li>
               </ul>
            </RuleItem>

             <RuleItem title="Tie-Break System" icon={<Scroll className="w-5 h-5"/>}>
               <p className="mb-2">In case of ties, the following tie-break systems will be applied in order:</p>
               <ol className="list-decimal pl-5 space-y-2 marker:text-gray-500">
                 <li>Direct Encounter (Winner over loser)</li>
                 <li>Buchholz System (Sum of opponents' scores)</li>
                 <li>Sonneborn-Berger System</li>
                 <li>Most Wins (Total number of won games)</li>
               </ol>
            </RuleItem>

             <RuleItem title="Conduct & Fair Play" icon={<Gavel className="w-5 h-5"/>}>
               <div className="space-y-4">
                 <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg flex gap-3">
                    <ShieldAlert className="w-6 h-6 text-chess-red flex-shrink-0" />
                    <div>
                        <h4 className="text-chess-red font-bold uppercase text-sm mb-1">Zero Tolerance Policy</h4>
                        <p className="text-sm">Use of chess engines, mobile phones, or outside assistance results in immediate disqualification and a ban from future events.</p>
                    </div>
                 </div>
                 <ul className="list-disc pl-5 space-y-2 marker:text-chess-gold">
                    <li><strong>Electronic Devices:</strong> All phones and smartwatches must be turned off and placed in bags designated area or under the table.</li>
                    <li><strong>Sportsmanship:</strong> Handshakes are mandatory before and after the game. Distracting behavior is strictly prohibited.</li>
                    <li><strong>Disputes:</strong> All claims must be made to the arbiter before the game continues. Arbiter's decision is final.</li>
                 </ul>
               </div>
            </RuleItem>
          </div>
       </div>
    </section>
  )
}
export default Rules;