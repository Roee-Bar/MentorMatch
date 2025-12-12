import React from 'react';
import { btnPrimary } from '@/lib/styles/shared-styles';

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
    <div className={`min-h-screen flex items-center justify-center dark:bg-slate-900 ${className}`}>
      <div className="text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className={btnPrimary}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;

