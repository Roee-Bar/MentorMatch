/**
 * StatCardWithIcon Component
 * 
 * An enhanced stat card that displays a statistic with an optional icon in a colored background.
 * 
 * @param title - The label for the statistic
 * @param value - The numeric or string value to display
 * @param description - Additional descriptive text
 * @param color - The color theme (affects icon background and value text)
 * @param icon - Optional React node (typically an SVG) to display in the colored icon container
 * 
 * @example
 * ```tsx
 * <StatCardWithIcon
 *   title="Total Students"
 *   value={42}
 *   description="Enrolled this semester"
 *   color="blue"
 *   icon={<svg>...</svg>}
 * />
 * ```
 */

interface StatCardWithIconProps {
  title: string;
  value: string | number;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  icon: React.ReactNode;
}

export default function StatCardWithIcon({
  title,
  value,
  description,
  color,
  icon,
}: StatCardWithIconProps) {
  const iconContainerClasses = {
    blue: 'stat-icon-blue',
    green: 'stat-icon-green',
    purple: 'stat-icon-purple',
    yellow: 'stat-icon-yellow',
    red: 'stat-icon-container bg-red-100',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  const valueColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <div className="card-base">
      <div className="flex-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-semibold text-gray-900 mt-1`}>
            {value}
          </p>
        </div>
        <div className={iconContainerClasses[color]}>
          <div className={`stat-icon ${iconColorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

