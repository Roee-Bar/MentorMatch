/**
 * lib/utils/filter-utils.ts
 * Generic filtering utilities for extracting, parsing, and filtering data
 */

import type { ExtractUniqueOptions, ParseCommaSeparatedOptions, FilterConfig, FilterOption } from './filter-types';
import type { Student } from '@/types/database';
import type { StudentPartnershipFilters } from '@/lib/hooks/useStudentPartnershipFilters';

/**
 * Extract unique values from an array of items
 * 
 * @param items - Array of items to extract values from
 * @param extractor - Function that extracts value(s) from each item
 * @param options - Options for normalization and sorting
 * @returns Array of unique values
 * 
 * @example
 * ```typescript
 * const departments = extractUniqueValues(students, s => s.department, { sort: true });
 * const skills = extractUniqueValues(students, s => s.skills?.split(',') || [], { normalize: true });
 * ```
 */
export function extractUniqueValues<T>(
  items: T[],
  extractor: (item: T) => string | string[],
  options: ExtractUniqueOptions = {}
): string[] {
  const { normalize = false, capitalize = false, sort = false } = options;
  
  const allValues = items
    .flatMap(item => {
      const value = extractor(item);
      return Array.isArray(value) ? value : [value];
    })
    .filter(Boolean)
    .map(val => {
      let processed = String(val).trim();
      if (normalize) {
        processed = processed.toLowerCase();
      }
      if (capitalize && processed.length > 0) {
        processed = processed.charAt(0).toUpperCase() + processed.slice(1);
      }
      return processed;
    });

  const unique = Array.from(new Set(allValues));
  
  return sort ? unique.sort() : unique;
}

/**
 * Parse a comma-separated string into an array of normalized values
 * 
 * @param value - Comma-separated string to parse
 * @param options - Options for normalization
 * @returns Array of parsed and normalized values
 * 
 * @example
 * ```typescript
 * const skills = parseCommaSeparatedString(student.skills, { normalize: true, capitalize: true });
 * // "python, javascript, react" -> ["Python", "Javascript", "React"]
 * ```
 */
export function parseCommaSeparatedString(
  value: string | undefined | null,
  options: ParseCommaSeparatedOptions = {}
): string[] {
  if (!value) return [];
  
  const { normalize = false, capitalize = false } = options;
  
  return value
    .split(',')
    .map(item => {
      let processed = item.trim();
      if (normalize) {
        processed = processed.toLowerCase();
      }
      if (capitalize && processed.length > 0) {
        processed = processed.charAt(0).toUpperCase() + processed.slice(1);
      }
      return processed;
    })
    .filter(Boolean);
}

/**
 * Create a filter predicate function based on filter configuration
 * 
 * @param filters - Current filter values
 * @param filterConfigs - Array of filter configurations
 * @returns Predicate function that returns true if item matches all filters
 * 
 * @example
 * ```typescript
 * const predicate = createFilterPredicate(filters, [
 *   { key: 'search', type: 'search', getValue: (s) => s.fullName },
 *   { key: 'department', type: 'exact', getValue: (s) => s.department },
 * ]);
 * const filtered = students.filter(predicate);
 * ```
 */
export function createFilterPredicate<T>(
  filters: Record<string, any>,
  filterConfigs: FilterConfig<T>[]
): (item: T) => boolean {
  return (item: T) => {
    for (const config of filterConfigs) {
      const filterValue = filters[config.key];
      
      // Skip if filter is not set or is 'all'
      if (filterValue === undefined || filterValue === null || filterValue === '' || filterValue === 'all') {
        continue;
      }

      const itemValue = config.getValue(item);
      const transformedItemValue = config.transform ? config.transform(itemValue) : itemValue;

      let matches = false;

      switch (config.type) {
        case 'search':
          // Case-insensitive substring match
          const searchStr = String(filterValue).toLowerCase();
          const itemStr = String(transformedItemValue).toLowerCase();
          matches = itemStr.includes(searchStr);
          break;

        case 'exact':
          // Case-insensitive exact match
          matches = String(transformedItemValue).toLowerCase() === String(filterValue).toLowerCase();
          break;

        case 'includes':
          // Check if filter value is included in array
          const itemArray = Array.isArray(transformedItemValue) 
            ? transformedItemValue.map(v => String(v).toLowerCase())
            : [String(transformedItemValue).toLowerCase()];
          matches = itemArray.includes(String(filterValue).toLowerCase());
          break;

        case 'custom':
          // Use custom matching function
          if (config.matchFn) {
            matches = config.matchFn(transformedItemValue, filterValue);
          }
          break;
      }

      if (!matches) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Calculate counts for each filter option based on current filter state
 * 
 * @param items - Array of items to count
 * @param filterOptions - Array of filter option values
 * @param getValue - Function to get the value to match from an item
 * @param applyOtherFilters - Optional predicate to apply other active filters
 * @returns Array of filter options with counts
 * 
 * @example
 * ```typescript
 * const departmentCounts = calculateFilterCounts(
 *   students,
 *   uniqueDepartments,
 *   (s) => s.department,
 *   (s) => {
 *     // Apply other filters (search, skill, etc.)
 *     if (filters.search && !s.fullName.toLowerCase().includes(filters.search.toLowerCase())) {
 *       return false;
 *     }
 *     return true;
 *   }
 * );
 * ```
 */
export function calculateFilterCounts<T>(
  items: T[],
  filterOptions: string[],
  getValue: (item: T) => string | string[],
  applyOtherFilters?: (item: T) => boolean
): FilterOption[] {
  return filterOptions.map(option => {
    const count = items.filter(item => {
      // Apply other filters if provided
      if (applyOtherFilters && !applyOtherFilters(item)) {
        return false;
      }

      // Get the value from the item
      const itemValue = getValue(item);
      const itemValues = Array.isArray(itemValue) 
        ? itemValue.map(v => String(v).toLowerCase().trim())
        : [String(itemValue).toLowerCase().trim()];

      // Check if option matches
      return itemValues.includes(option.toLowerCase().trim());
    }).length;

    return {
      label: option,
      value: option,
      count,
    };
  });
}

/**
 * Create a filter predicate function for student partnership filters
 * Applies all filters except the one specified in excludeFilter
 * 
 * @param filters - Current filter values
 * @param excludeFilter - Optional filter key to exclude (e.g., 'department' when counting departments)
 * @returns Predicate function that returns true if student matches all applicable filters
 * 
 * @example
 * ```typescript
 * const predicate = createStudentFilterPredicate(filters, 'department');
 * const filtered = students.filter(predicate);
 * ```
 */
export function createStudentFilterPredicate(
  filters: StudentPartnershipFilters,
  excludeFilter?: keyof StudentPartnershipFilters
): (student: Student) => boolean {
  return (student: Student) => {
    // Search filter (case-insensitive)
    if (excludeFilter !== 'search' && filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!student.fullName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Department filter (case-insensitive)
    if (excludeFilter !== 'department' && filters.department !== 'all') {
      if (student.department.toLowerCase() !== filters.department.toLowerCase()) {
        return false;
      }
    }

    // Skill filter (case-insensitive, checks comma-separated values)
    if (excludeFilter !== 'skill' && filters.skill !== 'all') {
      const studentSkills = parseCommaSeparatedString(student.skills, {
        normalize: true,
      });
      if (!studentSkills.includes(filters.skill.toLowerCase())) {
        return false;
      }
    }

    // Interest filter (case-insensitive, checks comma-separated values)
    if (excludeFilter !== 'interest' && filters.interest !== 'all') {
      const studentInterests = parseCommaSeparatedString(student.interests, {
        normalize: true,
      });
      if (!studentInterests.includes(filters.interest.toLowerCase())) {
        return false;
      }
    }

    return true;
  };
}

