'use client';

import { useState, useEffect, useRef } from 'react';
import FormInput from '@/app/components/form/FormInput';
import FormSelect from '@/app/components/form/FormSelect';
import { DEPARTMENTS } from '@/lib/constants';
import { btnSecondary, labelStyles, inputStyles, iconMuted, cardBaseCompact, dividerLight, textSecondary, textPrimary } from '@/lib/styles/shared-styles';

export interface FilterValues {
  search: string;
  department: string;
  skills: string;
  interests: string;
}

interface StudentFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  resultCount?: number;
}

export default function StudentFilters({
  filters,
  onFilterChange,
  resultCount,
}: StudentFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Debounce search input - using ref to avoid stale closure
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filtersRef.current.search) {
        onFilterChange({ ...filtersRef.current, search: localSearch });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onFilterChange]);

  // Update local search when filters change externally (e.g., URL sync)
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Convert empty string (placeholder) to 'all' for filter logic
    onFilterChange({ ...filters, [name]: value || 'all' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFilterChange({
      search: '',
      department: 'all',
      skills: '',
      interests: '',
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.department !== 'all' ||
    filters.skills ||
    filters.interests;

  return (
    <div className={`${cardBaseCompact} mb-6`}>
      {/* Main Filter Row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search Input - custom wrapper for search icon */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className={labelStyles}>
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              name="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, skills, interests..."
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

        {/* Department Filter */}
        <FormSelect
          label="Department"
          name="department"
          value={filters.department === 'all' ? '' : filters.department}
          onChange={handleSelectChange}
          options={[...DEPARTMENTS]}
          placeholder="All Departments"
          className="min-w-[180px]"
        />

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

      {/* Advanced Filters Row (Skills & Interests) */}
      <div className={`flex flex-wrap gap-4 ${dividerLight}`}>
        {/* Skills Filter */}
        <FormInput
          label="Skills"
          name="skills"
          value={filters.skills}
          onChange={handleInputChange}
          placeholder="e.g., Python, React, Machine Learning"
          helperText="Separate multiple with commas"
          className="flex-1 min-w-[200px]"
        />

        {/* Interests Filter */}
        <FormInput
          label="Interests"
          name="interests"
          value={filters.interests}
          onChange={handleInputChange}
          placeholder="e.g., AI, Web Development, Data Science"
          helperText="Separate multiple with commas"
          className="flex-1 min-w-[200px]"
        />
      </div>

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className={dividerLight}>
          <p className={`text-sm ${textSecondary}`}>
            Showing <span className={`font-semibold ${textPrimary}`}>{resultCount}</span> student{resultCount !== 1 ? 's' : ''}
            {hasActiveFilters && ' matching your filters'}
          </p>
        </div>
      )}
    </div>
  );
}

