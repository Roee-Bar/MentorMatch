import { textMuted } from '@/lib/styles/shared-styles';

// Loading spinner styles with dark mode support
const loadingContainer = 'min-h-screen flex items-center justify-center dark:bg-slate-900';
const loadingContent = 'text-center';
const spinnerMd = 'w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 dark:border-slate-700 dark:border-t-blue-500';
const spinnerSm = 'w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto dark:border-slate-700 dark:border-t-blue-500';

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
  const containerClass = fullScreen ? loadingContainer : loadingContent;
  const spinnerClass = size === 'sm' ? spinnerSm : spinnerMd;

  return (
    <div className={containerClass}>
      <div className={loadingContent}>
        <div className={spinnerClass}></div>
        {message && <p className={textMuted}>{message}</p>}
      </div>
    </div>
  );
}
