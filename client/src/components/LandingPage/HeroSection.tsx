import React from 'react';
import Button from '../common/Button'; // Assuming Button component is in common
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6">
          Welcome to Our Classifieds Platform
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
          Discover amazing deals or sell your items quickly and easily within your trusted community.
        </p>
        <div className="space-x-0 space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/listings"> {/* Assuming /listings will be the main grid view page */}
            <Button variant="primary" size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-blue-800">
              Browse Listings
            </Button>
          </Link>
          {/* Updated Link for Post an Ad button */}
          <Link to="/post/new">
            <Button variant="secondary" size="lg" className="bg-transparent hover:bg-white hover:text-blue-700 border-2 border-white text-white">
              Post an Ad
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
