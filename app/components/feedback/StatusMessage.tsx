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
  const boxStyles = {
    success: 'message-box-success',
    error: 'message-box-error',
    warning: 'message-box-warning',
    info: 'message-box-info',
  };

  const textStyles = {
    success: 'message-text-success',
    error: 'message-text-error',
    warning: 'message-text-warning',
    info: 'message-text-info',
  };

  return (
    <div className={`${boxStyles[type]} ${className}`}>
      <div className="flex-center-gap-2">
        <span className={textStyles[type]}>{message}</span>
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


