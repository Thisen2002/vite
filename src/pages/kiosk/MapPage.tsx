import React, { useState, useEffect } from 'react';
import MapComponent from '../Maps/Map.jsx';
import { addBuildingClickListner } from '../Maps/map_module.js';

const MapPageTailwind: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  useEffect(() => {
    addBuildingClickListner((buildingId: string) => {
      setSelectedBuildingId(buildingId);
      setIsSheetOpen(true);
    });
  }, []);

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
          <div className="inline-block bg-red-800 bg-opacity-80 px-4 py-2 rounded-md">
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
            className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-r-md transition-colors duration-200 border-2 border-blue-800 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Map Section */}
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-lg border border-blue-400/60 backdrop-blur-md bg-transparent relative">
        <MapComponent />
        
        {/* Side Sheet - positioned in the right area of map */}
        {isSheetOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-end p-4 translate-x-4 pointer-events-none">
            <div className="w-65 h-200 bg-gray-900/95 backdrop-blur-md border border-blue-800 rounded-2xl shadow-2xl transform-gpu transition-transform duration-300 ease-out pointer-events-auto">
              <div className="flex items-center justify-center py-2">
                <div className="h-1.5 w-12 rounded-full bg-gray-600" />
              </div>
              <div className="px-6 py-4 text-white relative">
                {/* X Close Button - positioned in top-right corner */}
                <button
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Close button clicked, current state:', isSheetOpen);
                    setIsSheetOpen(false);
                    console.log('Set to false, new state should be:', false);
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h2 className="text-xl font-semibold pr-10">Building Selected</h2>
                <p className="mt-1 text-gray-300">
                  Building ID: <span className="font-mono text-blue-300">{selectedBuildingId}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPageTailwind;
