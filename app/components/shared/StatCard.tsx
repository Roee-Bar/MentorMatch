import { cardBase, textMuted, textColorMap, iconMuted, spinnerSmall } from '@/lib/styles/shared-styles';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  color: 'blue' | 'green' | 'gray' | 'red';
  icon?: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

export default function StatCard({
  title,
  value,
  description,
  color,
  icon,
  isLoading = false,
  onClick,
  isActive = false,
}: StatCardProps) {
  const clickableClasses = onClick && 'cursor-pointer transition-all duration-200';
  const activeBorderClasses = isActive && 'ring-2 ring-blue-500 dark:ring-blue-400';
  const activeBgClasses = isActive && 'bg-blue-50 dark:bg-blue-900/20';

  return (
    <div 
      className={`${cardBase} h-full flex flex-col ${clickableClasses} ${activeBorderClasses} ${activeBgClasses}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <h3 className={`text-sm font-semibold ${textMuted}`}>{title}</h3>
        {isLoading && <div className={spinnerSmall}></div>}
        {icon && <div className={iconMuted}>{icon}</div>}
      </div>
      <p className={`text-3xl font-bold text-center ${textColorMap[color]} ${isLoading && 'opacity-60'}`}>
        {value}
      </p>
      <p className={`text-xs mt-1 text-center ${textMuted} line-clamp-2`}>{description}</p>
    </div>
  );
}
