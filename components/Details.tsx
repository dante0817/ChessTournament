import React from 'react';
import { Clock, Map, Info, AlertTriangle, ShieldCheck, GitBranch } from 'lucide-react';

const Details: React.FC = () => {
  return (
    <section id="details" className="py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-chess-cyan">Event Format</p>
            <h2 className="section-title text-4xl font-bold text-white">Tournament Structure</h2>
          </div>

          <article className="panel p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-chess-gold/20 p-3">
                <Clock className="h-5 w-5 text-chess-gold" />
              </div>
              <div>
                <h3 className="section-title text-xl text-white">Time Control and Rounds</h3>
                <p className="mt-2 muted-text">15 minutes + 3 seconds increment per move</p>
                <p className="mt-1 muted-text">7-round Swiss system</p>
              </div>
            </div>
          </article>

          <article className="panel p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-chess-cyan/20 p-3">
                <ShieldCheck className="h-5 w-5 text-chess-cyan" />
              </div>
              <div>
                <h3 className="section-title text-xl text-white">Rating Rules</h3>
                <p className="mt-2 muted-text">
                  Team average must be 1975 or below using local ratings as of February 2026.
                </p>
                <div className="mt-4 rounded-xl border border-chess-red/30 bg-chess-red/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-chess-red">
                    <AlertTriangle className="h-4 w-4" />
                    Rating Floor Rule
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Players rated 1799 and below, plus unrated players, are calculated as 1800.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-chess-cyan">Venue</p>
            <h2 className="section-title text-4xl font-bold text-white">Location and Access</h2>
          </div>

          <article className="panel overflow-hidden">
            <div className="h-72">
              <iframe
                title="Wellcome Plaza Mall Location"
                src="https://maps.google.com/maps?q=Wellcome+Plaza+Mall+Libertad+Pasay+City&output=embed&z=17"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <div className="mb-2 flex items-center gap-3">
                <Map className="h-5 w-5 text-chess-gold" />
                <h3 className="section-title text-xl text-white">Wellcome Plaza Mall</h3>
              </div>
              <p className="muted-text">LRT 1 Libertad, Pasay City</p>
              <p className="mt-1 text-sm text-slate-400">Level 2, Activity Center</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Wellcome+Plaza+Mall+Libertad+Pasay+City+Metro+Manila"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-chess-cyan transition hover:text-cyan-300"
              >
                <Map className="h-4 w-4" />
                Open in Google Maps
              </a>
            </div>
          </article>

          <article className="panel p-5">
            <div className="flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-chess-cyan" />
              <div>
                <p className="section-title text-base text-white">Organized by Pasay City Chess Federation</p>
                <p className="mt-1 text-sm muted-text">Official event updates and pairings will be posted here.</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="panel relative overflow-hidden p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-chess-cyan/5 to-chess-gold/10" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-5 rounded-full bg-white/5 p-5 ring-1 ring-white/15">
              <GitBranch className="h-10 w-10 text-chess-gold" />
            </div>
            <h3 className="section-title text-2xl text-white">Bracket Updates</h3>
            <p className="mt-2 max-w-xl text-sm muted-text">
              Bracket data is generated by the tournament system as rounds are released and results are entered.
            </p>
            <a
              href="#pairings"
              className="mt-6 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Open Public Pairings
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Details;
