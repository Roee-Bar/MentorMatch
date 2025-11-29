interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md';
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = true 
}: LoadingSpinnerProps) {
  const containerClass = fullScreen ? 'loading-container' : 'loading-content';
  const spinnerClass = size === 'sm' ? 'spinner-sm' : 'spinner';

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className={spinnerClass}></div>
        {message && <p className="text-gray-500">{message}</p>}
      </div>
    </div>
  );
}

