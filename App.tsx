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
import Pairings from './components/Pairings';

function App() {
  const getPage = () => {
    if (window.location.hash === '#admin') return 'admin';
    if (window.location.hash === '#pairings') return 'pairings';
    return 'home';
  };

  const [page, setPage] = useState<'home' | 'admin' | 'pairings'>(getPage);

  useEffect(() => {
    const onHash = () => setPage(getPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (page === 'admin') {
    return <Admin onBack={() => { window.location.hash = ''; setPage('home'); }} />;
  }

  if (page === 'pairings') {
    return <Pairings />;
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