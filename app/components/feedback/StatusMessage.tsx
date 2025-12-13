import React from 'react';

export type StatusMessageType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  message: string;
  type?: StatusMessageType;
  className?: string;
  onClose?: () => void;
}

// Message box styles with dark mode support
const messageBoxBase = 'mb-6 p-4 rounded-xl border';
const messageBoxStyles = {
  success: `${messageBoxBase} bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800`,
  error: `${messageBoxBase} bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800`,
  warning: `${messageBoxBase} bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800`,
  info: `${messageBoxBase} bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800`,
};

const messageTextStyles = {
  success: 'text-green-800 font-medium dark:text-green-200',
  error: 'text-red-800 font-medium dark:text-red-200',
  warning: 'text-yellow-800 font-medium dark:text-yellow-200',
  info: 'text-blue-800 font-medium dark:text-blue-200',
};

const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type = 'info',
  className = '',
  onClose,
}) => {
  return (
    <div className={`${messageBoxStyles[type]} ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <span className={messageTextStyles[type]}>{message}</span>
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
