import React from 'react';
import { Clock, Map, Info, AlertTriangle, ShieldCheck, GitBranch } from 'lucide-react';

const Details: React.FC = () => {
  return (
    <section id="details" className="py-20 bg-chess-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Format Column */}
          <div className="space-y-8">
            <h2 className="font-display text-4xl font-bold text-white border-l-4 border-chess-red pl-4">
              TOURNAMENT <br/><span className="text-chess-red">FORMAT</span>
            </h2>
            
            <div className="bg-chess-charcoal p-6 rounded-lg border-l-4 border-chess-gold">
              <div className="flex items-start gap-4">
                <div className="bg-chess-dark p-3 rounded-full">
                  <Clock className="h-6 w-6 text-chess-gold" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white mb-1">Time Control</h3>
                  <p className="text-gray-400">15 Minutes + 3 Seconds Increment</p>
                  <p className="text-gray-400 mt-1">7 Round Swiss System</p>
                </div>
              </div>
            </div>

            <div className="bg-chess-charcoal p-6 rounded-lg border-l-4 border-chess-gold">
              <div className="flex items-start gap-4">
                <div className="bg-chess-dark p-3 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-chess-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold text-white mb-1">Rating Rules</h3>
                  
                  <div className="group relative inline-block">
                    <p className="text-gray-400 mb-2 cursor-help border-b border-dotted border-gray-600 inline-block">
                      <span className="text-white font-bold">1975</span> Combine Average Local Ratings
                    </p>
                    
                    {/* Tooltip */}
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-zinc-900 border border-chess-gold/30 rounded-lg shadow-xl z-20 pointer-events-none">
                      <p className="text-xs text-gray-300 leading-relaxed text-center">
                        <span className="text-chess-gold font-bold block mb-1">RATING FLOOR RULE</span>
                        Players with ratings 1799 & below (and Unrated players) are automatically calculated as <span className="text-white font-bold">1800</span>.
                      </p>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 italic">
                    * Ratings as of February 2026
                  </p>
                  <div className="mt-3 bg-red-900/20 p-3 rounded border border-red-900/50">
                    <div className="flex gap-2 text-chess-red text-sm font-bold items-center">
                       <AlertTriangle className="h-4 w-4" />
                       IMPORTANT NOTE
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      Players with ratings 1799 & below and Unrated players are considered <span className="text-white font-bold">1800</span> for calculation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Venue Column */}
          <div className="space-y-8">
            <h2 className="font-display text-4xl font-bold text-white border-l-4 border-chess-red pl-4">
              VENUE <br/><span className="text-chess-red">LOCATION</span>
            </h2>

            <div className="bg-chess-charcoal rounded-xl overflow-hidden shadow-lg border border-gray-800">
               <div className="h-72">
                 <iframe
                   title="Wellcome Plaza Mall Location"
                   src="https://www.google.com/maps?q=Wellcome+Plaza+Mall,+Libertad,+Pasay+City,+Metro+Manila&output=embed"
                   width="100%"
                   height="100%"
                   style={{ border: 0 }}
                   allowFullScreen
                   loading="lazy"
                   referrerPolicy="no-referrer-when-downgrade"
                 />
               </div>
               <div className="p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <Map className="h-6 w-6 text-chess-red" />
                   <h3 className="font-display text-2xl font-bold text-white">Wellcome Plaza Mall</h3>
                 </div>
                 <p className="text-gray-400 ml-9">LRT 1 Libertad, Pasay City</p>
                 <p className="text-gray-500 ml-9 text-sm mt-2">Level 2, Activity Center</p>
                 <a
                   href="https://www.google.com/maps/search/Wellcome+Plaza+Mall,+Libertad,+Pasay+City"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="ml-9 mt-3 inline-flex items-center gap-1 text-chess-gold text-sm hover:underline"
                 >
                   <Map className="h-3.5 w-3.5" />
                   Open in Google Maps
                 </a>
               </div>
            </div>

            <div className="flex gap-4 p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
              <Info className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-blue-400 mb-1">Organizer</h4>
                <p className="text-gray-300">Organized by Pasay Chess Federation</p>
              </div>
            </div>
          </div>

        </div>

        {/* Tournament Bracket Section */}
        <div className="mt-20 pt-12 border-t border-gray-800">
           <div className="text-center mb-10">
              <h2 className="font-display text-4xl font-bold text-white mb-4">
                TOURNAMENT <span className="text-chess-gold">BRACKET</span>
              </h2>
              <p className="text-gray-400">Live updates and pairings will be posted here.</p>
           </div>
           
           <div className="relative bg-chess-charcoal/50 border border-gray-800 rounded-2xl p-8 md:p-12 text-center overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-chess-dark via-transparent to-transparent"></div>
              
              <div className="relative z-10 flex flex-col items-center justify-center py-12">
                 <div className="bg-gray-800 p-6 rounded-full mb-6 ring-4 ring-gray-700/50">
                    <GitBranch className="h-12 w-12 text-chess-gold opacity-80" />
                 </div>
                 <h3 className="text-2xl font-display font-bold text-white mb-2">Bracket Not Yet Available</h3>
                 <p className="text-gray-400 max-w-lg mx-auto mb-8">
                    The tournament bracket will be generated automatically after the registration period ends on March 8, 2026.
                 </p>
                 <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-gray-600 transition-colors text-sm cursor-not-allowed opacity-75">
                    View Full Bracket (Locked)
                 </button>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

const MapPinLarge = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#D92525"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default Details;