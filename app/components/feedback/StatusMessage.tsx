import React from 'react';

export type StatusMessageType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  message: string;
  type?: StatusMessageType;
  className?: string;
  onClose?: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type = 'info',
  className = '',
  onClose,
}) => {
  const typeStyles = {
    success: 'badge-success',
    error: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
  };

  return (
    <div className={`mt-5 p-3 rounded-lg text-center text-sm font-bold ${typeStyles[type]} ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusMessage;


