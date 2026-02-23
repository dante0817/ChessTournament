import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center">
        <p className="section-title text-2xl font-bold text-white">Pasay Chess Federation</p>
        <p className="text-sm text-slate-400">Copyright 2026 Non-Master Grudge Match. All rights reserved.</p>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Event Date: March 8, 2026</p>
      </div>
    </footer>
  );
};

export default Footer;
