/**
 * lib/utils/filter-types.ts
 * TypeScript types for filter configurations and utilities
 */

/**
 * Configuration for a single filter field
 */
export interface FilterConfig<T> {
  /** Unique key identifying this filter */
  key: string;
  /** Type of filter matching */
  type: 'search' | 'exact' | 'includes' | 'custom';
  /** Function to extract the value to filter from an item */
  getValue: (item: T) => string | string[] | any;
  /** Optional transform function to normalize the extracted value */
  transform?: (value: any) => any;
  /** Custom matching function (required for 'custom' type) */
  matchFn?: (itemValue: any, filterValue: any) => boolean;
}

/**
 * A filter option with label, value, and count
 */
export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

/**
 * Options for extracting unique values
 */
export interface ExtractUniqueOptions {
  /** Normalize values (lowercase and trim) */
  normalize?: boolean;
  /** Capitalize first letter of each value */
  capitalize?: boolean;
  /** Sort the resulting array */
  sort?: boolean;
}

/**
 * Options for parsing comma-separated strings
 */
export interface ParseCommaSeparatedOptions {
  /** Normalize values (lowercase and trim) */
  normalize?: boolean;
  /** Capitalize first letter of each value */
  capitalize?: boolean;
}

