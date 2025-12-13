import React from 'react';
import { textSecondary } from '@/lib/styles/shared-styles';

interface LoadingPageProps {
  message?: string;
  className?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8 ${className}`}>
      <div className="loading-content">
        <div className="spinner"></div>
        <p className={`${textSecondary} text-lg`}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingPage;


