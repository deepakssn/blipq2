import React from 'react';
import HeroSection from '../components/LandingPage/HeroSection';
import ListingsGrid from '../components/LandingPage/ListingsGrid';

const LandingPage: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <ListingsGrid />
      {/* Other sections can be added here if needed */}
    </div>
  );
};

export default LandingPage;
