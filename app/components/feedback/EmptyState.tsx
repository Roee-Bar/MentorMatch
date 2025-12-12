import React from 'react';
import { btnPrimary, cardBase, textMuted } from '@/lib/styles/shared-styles';

interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  action,
  icon,
  className = '',
}) => {
  return (
    <div className={`${cardBase} p-8 text-center ${className}`}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p className={`${textMuted} mb-4`}>{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`${btnPrimary} px-6`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

