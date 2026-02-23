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
    <article className="panel overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`rounded-xl p-2.5 ${isOpen ? 'bg-chess-gold/20 text-chess-gold' : 'bg-white/5 text-slate-400'}`}>
            {icon}
          </div>
          <h3 className="section-title text-lg font-semibold uppercase tracking-wide text-white">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
      </button>
      <div className={`${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden border-t border-white/10 transition-all`}>
        <div className="space-y-3 px-6 py-5 text-sm leading-relaxed text-slate-300">{children}</div>
      </div>
    </article>
  );
};

const Rules: React.FC = () => {
  return (
    <section id="rules" className="py-24">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-chess-cyan">Regulations</p>
          <h2 className="section-title text-4xl font-bold text-white">Tournament Rules</h2>
          <p className="mx-auto mt-3 max-w-2xl muted-text">
            Read all regulations before submitting registration to avoid pairing and eligibility issues.
          </p>
        </div>

        <div className="space-y-4">
          <RuleItem title="Team Eligibility and Composition" icon={<Users className="h-5 w-5" />} defaultOpen={true}>
            <ul className="list-disc space-y-2 pl-5 marker:text-chess-gold">
              <li>Strictly for non-master players only.</li>
              <li>Each team has exactly 2 players.</li>
              <li>Combined team average must not exceed 1975.</li>
              <li>Ratings are based on latest NCFP/FIDE local ratings as of February 2026.</li>
              <li>Players rated 1799 and below, and unrated players, are calculated as 1800.</li>
            </ul>
          </RuleItem>

          <RuleItem title="Pairing System and Time Control" icon={<Swords className="h-5 w-5" />}>
            <ul className="list-disc space-y-2 pl-5 marker:text-chess-cyan">
              <li>Format: 7-round Swiss system.</li>
              <li>Time control: 15 minutes + 3-second increment.</li>
              <li>Pairing software: official Swiss manager tooling.</li>
              <li>Players arriving 10 minutes after round start may be forfeited.</li>
            </ul>
          </RuleItem>

          <RuleItem title="Tie-Break System" icon={<Scroll className="h-5 w-5" />}>
            <p>In case of equal scores, tie-breakers are applied in this order:</p>
            <ol className="list-decimal space-y-2 pl-5 marker:text-slate-400">
              <li>Direct encounter</li>
              <li>Buchholz score</li>
              <li>Sonneborn-Berger score</li>
              <li>Most wins</li>
            </ol>
          </RuleItem>

          <RuleItem title="Conduct and Fair Play" icon={<Gavel className="h-5 w-5" />}>
            <div className="rounded-xl border border-chess-red/40 bg-chess-red/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-chess-red">
                <ShieldAlert className="h-4 w-4" />
                Zero-tolerance policy
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Use of engines, phones, or outside help results in disqualification and event ban.
              </p>
            </div>
            <ul className="list-disc space-y-2 pl-5 marker:text-chess-gold">
              <li>Phones and smartwatches must be fully switched off and stored away.</li>
              <li>Players must observe proper sportsmanship before and after each game.</li>
              <li>All disputes must be escalated to the arbiter immediately.</li>
            </ul>
          </RuleItem>
        </div>
      </div>
    </section>
  );
};

export default Rules;
