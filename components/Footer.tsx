import React, { useState } from 'react';
import { Trophy } from 'lucide-react';

const Footer: React.FC = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer className="border-t border-white/10 bg-slate-950/70 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5 p-1.5">
          {!logoError ? (
            <img
              src="/pccf-logo.png"
              alt="Pasay City Chess Federation Logo"
              className="h-full w-full rounded object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <Trophy className="h-6 w-6 text-chess-gold" />
          )}
        </div>
        <p className="section-title text-2xl font-bold text-white">Pasay City Chess Federation</p>
        <p className="text-sm text-slate-400">Copyright 2026 Non-Master Grudge Match. All rights reserved.</p>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Event Date: March 8, 2026</p>
      </div>
    </footer>
  );
};

export default Footer;
