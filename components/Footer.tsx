import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black py-10 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-display text-2xl font-bold text-white mb-2">
          PASAY CHESS FEDERATION
        </p>
        <p className="text-gray-500 text-sm">
          © 2026 Non-Master Grudge Match. All rights reserved.
        </p>
        <div className="mt-4 flex justify-center space-x-4">
            <span className="text-gray-600 text-xs">Event Date: March 8, 2026</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;