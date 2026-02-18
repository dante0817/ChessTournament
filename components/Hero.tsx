import React, { useState } from 'react';
import { Calendar, MapPin, Users, Facebook, Twitter, Linkedin, Share2, Check, MessageCircle } from 'lucide-react';

const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  
  // Use current window location if available, otherwise a placeholder
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = "Join the Pasay Chess Federation Grudge Match 2026! 🏆 Non-Master 2x2 Team Rapid.";

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-chess-dark min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
          alt="Chess Board" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-chess-dark via-transparent to-chess-dark"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block mb-4 px-4 py-1 border border-chess-red text-chess-red font-display tracking-widest text-sm uppercase rounded-full">
          Non-Master 2x2 Team Rapid
        </div>
        
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-2 uppercase leading-tight tracking-tight">
          Grudge <span className="text-transparent bg-clip-text bg-gradient-to-r from-chess-red to-orange-600">Match</span>
        </h1>
        
        <p className="font-display text-2xl md:text-3xl text-chess-gold mb-8 tracking-wide">
          1975 Combine Average Local Ratings
        </p>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 text-gray-300">
          <div className="flex items-center gap-2 bg-chess-charcoal/80 px-4 py-2 rounded-lg border border-gray-700">
            <Calendar className="h-5 w-5 text-chess-red" />
            <span className="font-bold">March 8, 2026 @ 11AM</span>
          </div>
          <div className="flex items-center gap-2 bg-chess-charcoal/80 px-4 py-2 rounded-lg border border-gray-700">
            <MapPin className="h-5 w-5 text-chess-red" />
            <span className="font-bold">Wellcome Plaza Mall, Pasay</span>
          </div>
          <div className="flex items-center gap-2 bg-chess-charcoal/80 px-4 py-2 rounded-lg border border-gray-700">
             <Users className="h-5 w-5 text-chess-red" />
             <span className="font-bold text-chess-gold">Limit to 70 Teams</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <a
            href="#registration"
            className="px-8 py-4 bg-chess-red hover:bg-red-700 text-white font-display font-bold text-xl rounded shadow-[0_0_20px_rgba(217,37,37,0.5)] transition-all transform hover:scale-105"
          >
            REGISTER NOW
          </a>
          <a
            href="#details"
            className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-display font-bold text-xl rounded transition-all"
          >
            VIEW RULES
          </a>
        </div>

        {/* Facebook Group Chat */}
        <div className="mb-12">
          <a
            href="FB_GC_INVITE_LINK_HERE"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold rounded-full transition-all hover:scale-105 shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            Join the Tournament GC
          </a>
          <p className="text-gray-500 text-xs mt-2">Get updates, announcements & connect with other teams</p>
        </div>

        {/* Social Share Section */}
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <p className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase">Share Event</p>
          <div className="flex gap-4">
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-800 transition-all hover:-translate-y-1"
              aria-label="Share on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-sky-900/30 text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-800 transition-all hover:-translate-y-1"
              aria-label="Share on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-indigo-900/30 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-800 transition-all hover:-translate-y-1"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
             <button 
              onClick={handleCopy}
              className="p-3 rounded-full bg-gray-800 text-gray-400 hover:bg-chess-gold hover:text-black border border-gray-700 transition-all hover:-translate-y-1"
              aria-label="Copy Link"
            >
              {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;