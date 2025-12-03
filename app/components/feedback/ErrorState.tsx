import React from 'react';

interface ErrorStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  action,
  className = '',
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center">
        <p className="text-red-600 mb-4">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;

