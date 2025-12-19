import { cardBase, textMuted, textColorMap, iconMuted } from '@/lib/styles/shared-styles';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  color: 'blue' | 'green' | 'gray' | 'red';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export default function StatCard({
  title,
  value,
  description,
  color,
  icon,
  isLoading = false,
}: StatCardProps) {
  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold ${textMuted}`}>{title}</h3>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin dark:border-slate-600 dark:border-t-blue-500"></div>
          )}
          {icon && <div className={iconMuted}>{icon}</div>}
        </div>
      </div>
      <div className="relative">
        <p className={`text-3xl font-bold ${textColorMap[color]} ${isLoading ? 'opacity-60' : ''}`}>
          {value}
        </p>
      </div>
      <p className={`text-xs mt-1 ${textMuted}`}>{description}</p>
    </div>
  );
}
