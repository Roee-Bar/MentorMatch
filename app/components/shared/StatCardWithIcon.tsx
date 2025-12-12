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

import { cardBase, iconContainerBase } from '@/lib/styles/shared-styles';

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
    blue: `${iconContainerBase} bg-blue-100 dark:bg-blue-900/50`,
    green: `${iconContainerBase} bg-green-100 dark:bg-green-900/50`,
    purple: `${iconContainerBase} bg-purple-100 dark:bg-purple-900/50`,
    yellow: `${iconContainerBase} bg-yellow-100 dark:bg-yellow-900/50`,
    red: `${iconContainerBase} bg-red-100 dark:bg-red-900/50`,
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1 dark:text-slate-100">
            {value}
          </p>
        </div>
        <div className={iconContainerClasses[color]}>
          <div className={`w-6 h-6 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
