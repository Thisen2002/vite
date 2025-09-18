import React, { useState } from 'react';
import MapComponent from '../Maps/Map.jsx';

interface MapPageTailwindProps {}

const MapPageTailwind: React.FC<MapPageTailwindProps> = () => {
  const [showMessage, setShowMessage] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      {/* Title Section */}
      <div className="text-center mb-4">
        <h1 className="text-5xl font-bold text-white drop-shadow-md">
          Interactive Campus Navigation
        </h1>
        <p className="text-lg text-gray-300 mt-2">
          Faculty of Engineering • University of Peradeniya
        </p>

        <div>
          <div className="inline-block bg-red-600 bg-opacity-70 px-4 py-2 rounded-md">
            <span className="text-white">Click on buildings to see exhibit information</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-4xl mb-4">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            placeholder="Search for exhibits..."
            className="flex-grow px-4 py-2 rounded-l-md border-2 border-blue-400/60 bg-white/90 text-gray-800 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors duration-200"
          >
            Search
          </button>
        </form>
      </div>

      {/* Map Section */}
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-lg border border-blue-400/60 backdrop-blur-md bg-transparent relative">
        <MapComponent />
      </div>
    </div>
  );
};

export default MapPageTailwind;
