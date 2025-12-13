// lib/styles/color-utilities.ts
// Centralized color utilities for consistent theming

// Base icon container style (duplicated here to avoid circular dependency)
const iconContainerBaseLocal = 'w-12 h-12 rounded-lg flex items-center justify-center';

// ============= TEXT COLOR ACCENTS =============
export const textGreen = 'text-green-600 dark:text-green-400';
export const textRed = 'text-red-600 dark:text-red-400';
export const textPurple = 'text-purple-600 dark:text-purple-400';
export const textYellow = 'text-yellow-600 dark:text-yellow-400';
export const textOrange = 'text-orange-600 dark:text-orange-400';
export const textGray = 'text-gray-600 dark:text-slate-400';

// ============= INFO TEXT (Blue variants) =============
export const textInfoLight = 'text-blue-700 dark:text-blue-300';
export const textInfoDark = 'text-blue-900 dark:text-blue-200';

// ============= BACKGROUND COLOR ACCENTS =============
export const bgGreen = 'bg-green-600 dark:bg-green-500';
export const bgYellow = 'bg-yellow-600 dark:bg-yellow-500';
export const bgRed = 'bg-red-600 dark:bg-red-500';
export const bgBlue = 'bg-blue-600 dark:bg-blue-500';

// ============= ICON CONTAINERS (Colored) =============
export const iconContainerBlue = `${iconContainerBaseLocal} bg-blue-100 dark:bg-blue-900/50`;
export const iconContainerGreen = `${iconContainerBaseLocal} bg-green-100 dark:bg-green-900/50`;
export const iconContainerPurple = `${iconContainerBaseLocal} bg-purple-100 dark:bg-purple-900/50`;
export const iconContainerYellow = `${iconContainerBaseLocal} bg-yellow-100 dark:bg-yellow-900/50`;
export const iconContainerRed = `${iconContainerBaseLocal} bg-red-100 dark:bg-red-900/50`;

// ============= CENTERED TEXT UTILITIES =============
export const textErrorCentered = 'text-sm text-red-600 text-center dark:text-red-400';

// ============= COLOR MAPS (for dynamic color selection) =============
export const textColorMap = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: textGreen,
  red: textRed,
  purple: textPurple,
  yellow: textYellow,
  orange: textOrange,
  gray: textGray,
} as const;

export const bgColorMap = {
  green: bgGreen,
  yellow: bgYellow,
  red: bgRed,
  blue: bgBlue,
} as const;

export const iconContainerMap = {
  blue: iconContainerBlue,
  green: iconContainerGreen,
  purple: iconContainerPurple,
  yellow: iconContainerYellow,
  red: iconContainerRed,
} as const;

