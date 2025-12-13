import { cardBase, textMuted } from '@/lib/styles/shared-styles';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  color: 'blue' | 'green' | 'gray' | 'red';
  icon?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  description,
  color,
  icon,
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    gray: 'text-gray-600 dark:text-slate-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold ${textMuted}`}>{title}</h3>
        {icon && <div className="text-gray-400 dark:text-slate-500">{icon}</div>}
      </div>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className={`text-xs mt-1 ${textMuted}`}>{description}</p>
    </div>
  );
}
