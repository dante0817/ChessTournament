import React, { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Facebook,
  Twitter,
  Linkedin,
  Share2,
  Check,
  MessageCircle,
  Signal,
} from 'lucide-react';
import { fetchSlots, SlotsResult } from '../services/api';

const HERO_BG =
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1950&q=80';

const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [slots, setSlots] = useState<SlotsResult | null>(null);
  const [slotError, setSlotError] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const shareText =
    'Join the Pasay City Chess Federation Grudge Match 2026. Non-Master 2x2 Team Rapid.';

  useEffect(() => {
    let mounted = true;
    fetchSlots()
      .then((data) => {
        if (mounted) setSlots(data);
      })
      .catch(() => {
        if (mounted) setSlotError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
      <img
        src={HERO_BG}
        alt="Chess board background"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-chess-background via-chess-background/70 to-chess-background" />
      <div className="absolute -right-48 top-20 h-96 w-96 rounded-full bg-chess-cyan/20 blur-[120px]" />
      <div className="absolute -left-48 bottom-10 h-96 w-96 rounded-full bg-chess-gold/20 blur-[120px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-rise">
          <p className="mb-6 inline-flex items-center rounded-full border border-chess-cyan/40 bg-chess-cyan/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-chess-cyan">
            Non-Master 2x2 Team Rapid
          </p>

          <h1 className="section-title text-5xl font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            Grudge Match
            <span className="block bg-gradient-to-r from-chess-gold via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Federation Championship
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg muted-text">
            Teams of two. Rapid format. A hard cap of 70 entries. Compete under the 1975 average
            limit and fight for the top board.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#registration"
              className="rounded-xl bg-gradient-to-r from-chess-gold to-amber-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-slate-950 shadow-glow transition hover:brightness-110"
            >
              Register Team
            </a>
            <a
              href="#rules"
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold uppercase tracking-wide text-slate-100 transition hover:border-white/40 hover:bg-white/10"
            >
              View Rules
            </a>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            <div className="panel p-4">
              <div className="mb-2 inline-flex rounded-lg bg-white/5 p-2">
                <Calendar className="h-4 w-4 text-chess-gold" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Date</p>
              <p className="mt-1 text-sm font-semibold text-white">March 8, 2026 at 11:00 AM</p>
            </div>
            <div className="panel p-4">
              <div className="mb-2 inline-flex rounded-lg bg-white/5 p-2">
                <MapPin className="h-4 w-4 text-chess-cyan" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Venue</p>
              <p className="mt-1 text-sm font-semibold text-white">Wellcome Plaza Mall, Pasay</p>
            </div>
            <div className="panel p-4">
              <div className="mb-2 inline-flex rounded-lg bg-white/5 p-2">
                <Users className="h-4 w-4 text-chess-red" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Team Cap</p>
              <p className="mt-1 text-sm font-semibold text-white">70 Teams Max</p>
            </div>
          </div>
        </div>

        <aside className="animate-fade-rise panel h-fit p-6 [animation-delay:120ms]">
          <h2 className="section-title text-2xl text-white">Live Registration Monitor</h2>
          {!slotError && slots && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">Slots Remaining</p>
                <Signal className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-4xl font-bold text-emerald-300">{slots.remaining}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                {slots.registered} teams already registered
              </p>
            </div>
          )}
          {(!slots || slotError) && (
            <p className="mt-5 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300">
              Live slot count is currently unavailable. Registration is still open.
            </p>
          )}

          <a
            href="FB_GC_INVITE_LINK_HERE"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <MessageCircle className="h-4 w-4" />
            Join Tournament Group Chat
          </a>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Share Event</p>
            <div className="mt-3 flex gap-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-2.5 text-blue-300 transition hover:bg-blue-500 hover:text-white"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-2.5 text-sky-300 transition hover:bg-sky-500 hover:text-white"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 p-2.5 text-indigo-300 transition hover:bg-indigo-500 hover:text-white"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <button
                onClick={handleCopy}
                className="rounded-lg border border-white/20 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Copy Link"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Hero;
