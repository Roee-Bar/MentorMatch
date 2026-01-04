'use client';

import { useState, useEffect, useRef } from 'react';
import FormInput from '@/app/components/form/FormInput';
import FormSelect from '@/app/components/form/FormSelect';
import { btnSecondary, labelStyles, inputStyles, iconMuted, cardBaseCompact, dividerLight, textSecondary, textPrimary } from '@/lib/styles/shared-styles';

export type FilterFieldType = 'search' | 'select' | 'text';

export interface FilterFieldConfig {
  name: string;
  type: FilterFieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  defaultValue?: string;
}

export interface GenericFiltersProps<FilterValues extends Record<string, string>> {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  resultCount?: number;
  entityName?: string; // e.g., "student", "supervisor" for pluralization
  fields: FilterFieldConfig[];
  clearFiltersValue: FilterValues; // Default values when clearing filters
}

export default function GenericFilters<FilterValues extends Record<string, string>>({
  filters,
  onFilterChange,
  resultCount,
  entityName = 'item',
  fields,
  clearFiltersValue,
}: GenericFiltersProps<FilterValues>) {
  const searchField = fields.find(f => f.type === 'search');
  const selectFields = fields.filter(f => f.type === 'select');
  const textFields = fields.filter(f => f.type === 'text');
  
  const [localSearch, setLocalSearch] = useState(
    searchField ? (filters[searchField.name] as string) || '' : ''
  );
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Debounce search input - using ref to avoid stale closure
  useEffect(() => {
    if (!searchField) return;
    
    const timer = setTimeout(() => {
      if (localSearch !== (filtersRef.current[searchField.name] as string)) {
        onFilterChange({ ...filtersRef.current, [searchField.name]: localSearch } as FilterValues);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onFilterChange, searchField]);

  // Update local search when filters change externally (e.g., URL sync)
  useEffect(() => {
    if (searchField) {
      setLocalSearch((filters[searchField.name] as string) || '');
    }
  }, [filters, searchField]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Convert empty string (placeholder) to 'all' for filter logic
    const fieldConfig = fields.find(f => f.name === name);
    const defaultValue = fieldConfig?.defaultValue || 'all';
    onFilterChange({ ...filters, [name]: value || defaultValue } as FilterValues);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value } as FilterValues);
  };

  const handleClearFilters = () => {
    if (searchField) {
      setLocalSearch('');
    }
    onFilterChange(clearFiltersValue);
  };

  // Check if any filters are active
  const hasActiveFilters = fields.some(field => {
    const value = filters[field.name] as string;
    if (field.type === 'select') {
      const defaultValue = field.defaultValue || 'all';
      return value !== defaultValue;
    }
    return !!value;
  });

  return (
    <div className={`${cardBaseCompact} mb-6`}>
      {/* Main Filter Row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search Input */}
        {searchField && (
          <div className="flex-1 min-w-[200px]">
            <label htmlFor={searchField.name} className={labelStyles}>
              {searchField.label}
            </label>
            <div className="relative">
              <input
                type="text"
                id={searchField.name}
                name={searchField.name}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={searchField.placeholder}
                className={`${inputStyles} pl-10`}
              />
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Select Fields */}
        {selectFields.map((field) => (
          <FormSelect
            key={field.name}
            label={field.label}
            name={field.name}
            value={(filters[field.name] as string) === (field.defaultValue || 'all') ? '' : (filters[field.name] as string)}
            onChange={handleSelectChange}
            options={field.options || []}
            placeholder={field.placeholder}
            className={field.className || 'min-w-[180px]'}
          />
        ))}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className={btnSecondary}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters Row (Text Fields) */}
      {textFields.length > 0 && (
        <div className={`flex flex-wrap gap-4 ${dividerLight}`}>
          {textFields.map((field) => (
            <FormInput
              key={field.name}
              label={field.label}
              name={field.name}
              value={(filters[field.name] as string) || ''}
              onChange={handleInputChange}
              placeholder={field.placeholder}
              helperText={field.helperText}
              className={field.className || 'flex-1 min-w-[200px]'}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className={dividerLight}>
          <p className={`text-sm ${textSecondary}`}>
            Showing <span className={`font-semibold ${textPrimary}`}>{resultCount}</span> {entityName}{resultCount !== 1 ? 's' : ''}
            {hasActiveFilters && ' matching your filters'}
          </p>
        </div>
      )}
    </div>
  );
}

