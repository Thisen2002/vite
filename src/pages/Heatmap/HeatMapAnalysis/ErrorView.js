import React from 'react';

const ErrorView = ({ message = "An error occurred.", onRetry }) => {
  return (
    <div className="flex items-center justify-center h-64 p-4">
      <div className="px-8 py-6 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg border border-white/40 text-center">
        <div className="text-red-500 text-3xl mb-2">⚠️</div>
        <p className="text-sm text-red-700 font-medium mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow hover:shadow-md transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorView;