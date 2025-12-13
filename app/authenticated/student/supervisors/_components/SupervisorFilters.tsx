'use client';

import { useState, useEffect, useRef } from 'react';
import FormInput from '@/app/components/form/FormInput';
import FormSelect from '@/app/components/form/FormSelect';
import { DEPARTMENTS, AVAILABILITY_FILTER_OPTIONS } from '@/lib/constants';
import { btnSecondary, labelStyles, inputStyles, iconMuted, cardBaseCompact, dividerLight } from '@/lib/styles/shared-styles';

// Availability options without 'all' for FormSelect (uses placeholder for "all")
const AVAILABILITY_OPTIONS = AVAILABILITY_FILTER_OPTIONS.filter(opt => opt.value !== 'all');

export interface FilterValues {
  search: string;
  department: string;
  availability: string;
  expertise: string;
  interests: string;
}

interface SupervisorFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  resultCount?: number;
}

export default function SupervisorFilters({
  filters,
  onFilterChange,
  resultCount,
}: SupervisorFiltersProps) {
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
      availability: 'all',
      expertise: '',
      interests: '',
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.department !== 'all' || 
    filters.availability !== 'all' ||
    filters.expertise ||
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
              placeholder="Search by name, bio, expertise..."
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

        {/* Availability Filter */}
        <FormSelect
          label="Availability"
          name="availability"
          value={filters.availability === 'all' ? '' : filters.availability}
          onChange={handleSelectChange}
          options={[...AVAILABILITY_OPTIONS]}
          placeholder="All Availability"
          className="min-w-[160px]"
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

      {/* Advanced Filters Row (Expertise & Interests) */}
      <div className={`flex flex-wrap gap-4 ${dividerLight}`}>
        {/* Expertise Filter */}
        <FormInput
          label="Expertise Areas"
          name="expertise"
          value={filters.expertise}
          onChange={handleInputChange}
          placeholder="e.g., Machine Learning, Python"
          helperText="Separate multiple with commas"
          className="flex-1 min-w-[200px]"
        />

        {/* Research Interests Filter */}
        <FormInput
          label="Research Interests"
          name="interests"
          value={filters.interests}
          onChange={handleInputChange}
          placeholder="e.g., AI, Data Science"
          helperText="Separate multiple with commas"
          className="flex-1 min-w-[200px]"
        />
      </div>

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className={dividerLight}>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Showing <span className="font-semibold text-gray-900 dark:text-slate-100">{resultCount}</span> supervisor{resultCount !== 1 ? 's' : ''}
            {hasActiveFilters && ' matching your filters'}
          </p>
        </div>
      )}
    </div>
  );
}
