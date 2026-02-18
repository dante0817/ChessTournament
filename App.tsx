import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Details from './components/Details';
import Rules from './components/Rules';
import PrizeSection from './components/PrizeSection';
import RatingCalculator from './components/RatingCalculator';
import Registration from './components/Registration';
import Footer from './components/Footer';
import Admin from './components/Admin';

function App() {
  const [page, setPage] = useState<'home' | 'admin'>(
    window.location.hash === '#admin' ? 'admin' : 'home'
  );

  useEffect(() => {
    const onHash = () => setPage(window.location.hash === '#admin' ? 'admin' : 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (page === 'admin') {
    return <Admin onBack={() => { window.location.hash = ''; setPage('home'); }} />;
  }

  return (
    <div className="min-h-screen bg-chess-dark text-white font-sans selection:bg-chess-red selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Details />
        <Rules />
        <PrizeSection />
        <RatingCalculator />
        <Registration />
      </main>
      <Footer />
    </div>
  );
}

export default App;