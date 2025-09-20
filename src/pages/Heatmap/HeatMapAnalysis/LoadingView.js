import React from 'react';

const LoadingView = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="px-8 py-6 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg border border-white/40">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 animate-pulse opacity-90" />
          <p className="mt-3 text-sm font-medium text-gray-700 tracking-wide">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingView;