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

import { cardBase, textMuted, iconContainerMap, textColorMap } from '@/lib/styles/shared-styles';

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
  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${textMuted}`}>{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1 dark:text-slate-100">
            {value}
          </p>
        </div>
        <div className={iconContainerMap[color]}>
          <div className={`w-6 h-6 ${textColorMap[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
