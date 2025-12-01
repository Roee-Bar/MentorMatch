// app/components/authenticated/CapacityIndicator.tsx
// Visual capacity gauge component for supervisor authenticated page

interface CapacityIndicatorProps {
  current: number;
  max: number;
  status: 'available' | 'limited' | 'unavailable';
}

export default function CapacityIndicator({ current, max, status }: CapacityIndicatorProps) {
  // Calculate percentage
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  
  // Determine progress bar color based on status prop for consistency
  // This ensures the bar and badge always show matching colors
  const getProgressBarColor = () => {
    switch (status) {
      case 'available':
        return 'bg-green-600';
      case 'limited':
        return 'bg-yellow-600';
      case 'unavailable':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };
  
  // Determine status badge color - matches progress bar color theme
  const getStatusBadgeColor = () => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Capitalize status text
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Capacity Status</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
          {statusText}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Capacity numbers */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-800">
            {current} / {max}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {percentage}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${getProgressBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-600">
          Current supervisions
        </p>
      </div>
    </div>
  );
}
