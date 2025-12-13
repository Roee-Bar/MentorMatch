import { cardBase, textMuted, textColorMap, iconMuted } from '@/lib/styles/shared-styles';

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
  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold ${textMuted}`}>{title}</h3>
        {icon && <div className={iconMuted}>{icon}</div>}
      </div>
      <p className={`text-3xl font-bold ${textColorMap[color]}`}>{value}</p>
      <p className={`text-xs mt-1 ${textMuted}`}>{description}</p>
    </div>
  );
}
