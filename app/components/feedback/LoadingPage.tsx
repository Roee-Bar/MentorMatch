import React from 'react';

interface LoadingPageProps {
  message?: string;
  className?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 ${className}`}>
      <div className="loading-content">
        <div className="spinner"></div>
        <p className="text-gray-700 text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingPage;

