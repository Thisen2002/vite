import React from 'react';
import MapComponent from '../Maps/Map.jsx';

interface MapPageTailwindProps {}

const MapPageTailwind: React.FC<MapPageTailwindProps> = () => {
  return (
    <div className="flex flex-col items-center w-full p-6">
      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-white drop-shadow-md">
          Interactive Campus Navigation
        </h1>
        <p className="text-lg text-gray-300 mt-2">
          Faculty of Engineering • University of Peradeniya
        </p>
      </div>

      {/* Map Section */}
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-lg border border-blue-400/60 backdrop-blur-md bg-transparent">
        <MapComponent />
      </div>
    </div>
  );
};

export default MapPageTailwind;
