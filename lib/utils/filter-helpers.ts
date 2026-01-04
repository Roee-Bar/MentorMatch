/**
 * Filter Helper Utilities
 * 
 * Shared filtering functions for use across service layers
 */

/**
 * Normalize a search term by trimming and converting to lowercase
 * Returns undefined if the term is empty or undefined
 * 
 * @param term - Search term to normalize
 * @returns Normalized search term or undefined
 */
export function normalizeSearchTerm(term?: string): string | undefined {
  if (!term) return undefined;
  const normalized = term.toLowerCase().trim();
  return normalized || undefined;
}

/**
 * Parse and normalize a comma-separated list of values
 * Splits by comma, trims each value, converts to lowercase, and filters out empty values
 * 
 * @param value - Comma-separated string (e.g., "Python, React, Machine Learning")
 * @returns Array of normalized strings, or empty array if value is empty/undefined
 */
export function normalizeCommaSeparatedList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Filter items by search term across multiple fields
 * 
 * @param items - Array of items to filter
 * @param search - Search term (will be normalized)
 * @param getSearchFields - Function that returns an array of searchable field values for each item
 * @returns Filtered array of items
 */
export function filterBySearchTerm<T>(
  items: T[],
  search: string | undefined,
  getSearchFields: (item: T) => string[]
): T[] {
  if (!search) return items;
  
  const normalizedSearch = normalizeSearchTerm(search);
  if (!normalizedSearch) return items;
  
  return items.filter(item => {
    const fields = getSearchFields(item);
    return fields.some(field => 
      field.toLowerCase().includes(normalizedSearch)
    );
  });
}

/**
 * Filter items by department
 * 
 * @param items - Array of items to filter
 * @param department - Department value to filter by (ignored if 'all' or undefined)
 * @param getDepartment - Function that returns the department value for each item
 * @returns Filtered array of items
 */
export function filterByDepartment<T>(
  items: T[],
  department: string | undefined,
  getDepartment: (item: T) => string
): T[] {
  if (!department || department === 'all') return items;
  
  const normalizedDepartment = department.toLowerCase();
  return items.filter(item => 
    getDepartment(item).toLowerCase() === normalizedDepartment
  );
}

/**
 * Filter items by a comma-separated field (e.g., skills, interests)
 * Matches if any of the filter values are found in the item's field
 * 
 * @param items - Array of items to filter
 * @param filterValue - Comma-separated string of values to filter by
 * @param getField - Function that returns the field value for each item (can be undefined)
 * @returns Filtered array of items
 */
export function filterByCommaSeparatedField<T>(
  items: T[],
  filterValue: string | undefined,
  getField: (item: T) => string | undefined
): T[] {
  if (!filterValue) return items;
  
  const filterValues = normalizeCommaSeparatedList(filterValue);
  if (filterValues.length === 0) return items;
  
  return items.filter(item => {
    const fieldValue = getField(item);
    if (!fieldValue) return false;
    
    const itemValues = normalizeCommaSeparatedList(fieldValue);
    return filterValues.some(filterVal => 
      itemValues.some(itemVal => itemVal.includes(filterVal))
    );
  });
}

/**
 * Filter items by an array field (e.g., expertiseAreas, researchInterests)
 * Matches if any of the filter values are found in the item's array field
 * 
 * @param items - Array of items to filter
 * @param filterValue - Comma-separated string of values to filter by
 * @param getFieldArray - Function that returns the array field for each item
 * @returns Filtered array of items
 */
export function filterByArrayField<T>(
  items: T[],
  filterValue: string | undefined,
  getFieldArray: (item: T) => string[]
): T[] {
  if (!filterValue) return items;
  
  const filterValues = normalizeCommaSeparatedList(filterValue);
  if (filterValues.length === 0) return items;
  
  return items.filter(item => {
    const fieldArray = getFieldArray(item);
    return filterValues.some(filterVal => 
      fieldArray.some(fieldVal => 
        fieldVal.toLowerCase().includes(filterVal)
      )
    );
  });
}

/**
 * Filter items by exact enum value match
 * 
 * @param items - Array of items to filter
 * @param filterValue - Value to filter by (ignored if 'all' or undefined)
 * @param getField - Function that returns the field value for each item
 * @returns Filtered array of items
 */
export function filterByEnum<T>(
  items: T[],
  filterValue: string | undefined,
  getField: (item: T) => string
): T[] {
  if (!filterValue || filterValue === 'all') return items;
  
  return items.filter(item => getField(item) === filterValue);
}

