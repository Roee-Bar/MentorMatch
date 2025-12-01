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
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600',
    red: 'text-red-600',
  };

  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

