import React, { useState } from 'react';
import { Menu, X, Trophy } from 'lucide-react';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { label: 'Details', href: '#details' },
  { label: 'Rules', href: '#rules' },
  { label: 'Prizes', href: '#prizes' },
  { label: 'Calculator', href: '#calculator' },
  { label: 'Registration', href: '#registration' },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-chess-dark/95 backdrop-blur-sm border-b border-chess-gold/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-chess-gold" />
            <span className="font-display font-bold text-xl tracking-wider text-white">
              PASAY<span className="text-chess-red">CHESS</span>
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="font-display text-gray-300 hover:text-chess-gold px-3 py-2 rounded-md text-lg font-medium transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-chess-charcoal focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-chess-charcoal border-b border-chess-gold/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="font-display text-gray-300 hover:text-chess-gold block px-3 py-2 rounded-md text-base font-medium"
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