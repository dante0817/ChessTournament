import React, { useState } from 'react';
import { Menu, X, Trophy } from 'lucide-react';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { label: 'Details', href: '#details' },
  { label: 'Rules', href: '#rules' },
  { label: 'Prizes', href: '#prizes' },
  { label: 'Calculator', href: '#calculator' },
  { label: 'Registration', href: '#registration' },
  { label: 'Pairings', href: '#pairings' },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-slate-700/40 bg-chess-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-chess-gold/30 to-chess-cyan/20 p-2.5 ring-1 ring-white/20">
              <Trophy className="h-6 w-6 text-chess-gold" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-wide text-white">PASAY CHESS FEDERATION</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Grudge Match 2026</p>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-2 py-1.5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none"
              aria-label="Toggle navigation"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
