'use client';

import { useMemo } from 'react';
import SearchInput from '@/app/components/form/SearchInput';
import FilterButtons from '@/app/components/display/FilterButtons';
import { btnSecondary, cardBaseCompact, dividerLight, textSecondary, textPrimary, labelStyles } from '@/lib/styles/shared-styles';
import type { StudentPartnershipFilters } from '@/lib/hooks/useStudentPartnershipFilters';
import type { FilterOption } from '@/lib/utils/filter-types';

const FILTER_ALL = 'all' as const;

interface StudentPartnershipFiltersProps {
  filters: StudentPartnershipFilters;
  onFilterChange: (filters: StudentPartnershipFilters) => void;
  onClearFilters: () => void;
  uniqueDepartments: string[];
  uniqueSkills: string[];
  uniqueInterests: string[];
  totalCount: number;
  filteredCount: number;
  getFilterCounts: (filterType: 'department' | 'skill' | 'interest') => FilterOption[];
}

/**
 * Filter component for student partnerships
 * Uses SearchInput component and filter utilities for maintainability
 */
export default function StudentPartnershipFilters({
  filters,
  onFilterChange,
  onClearFilters,
  uniqueDepartments,
  uniqueSkills,
  uniqueInterests,
  totalCount,
  filteredCount,
  getFilterCounts,
}: StudentPartnershipFiltersProps) {
  // Calculate counts for each filter option using hook method
  // Counts reflect current filter state (excluding the filter being counted)
  // IMPORTANT: All hooks must be called before any conditional returns to follow Rules of Hooks
  const departmentCounts = useMemo(() => {
    return getFilterCounts('department');
  }, [getFilterCounts]);

  const skillCounts = useMemo(() => {
    return getFilterCounts('skill');
  }, [getFilterCounts]);

  const interestCounts = useMemo(() => {
    return getFilterCounts('interest');
  }, [getFilterCounts]);

  // Early return if no students available (after all hooks are called)
  if (totalCount === 0) {
    return null;
  }

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleFilterButtonChange = (type: 'department' | 'skill' | 'interest', value: string) => {
    // Toggle: if same value clicked, set to 'all'
    const currentValue = filters[type];
    const newValue = currentValue === value ? FILTER_ALL : value;
    onFilterChange({ ...filters, [type]: newValue });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.department !== FILTER_ALL || 
    filters.skill !== FILTER_ALL ||
    filters.interest !== FILTER_ALL;

  // Add "All" option to each filter group
  const departmentFilters = [
    { label: 'All Departments', value: FILTER_ALL, count: totalCount },
    ...departmentCounts
  ];

  const skillFilters = [
    { label: 'All Skills', value: FILTER_ALL, count: totalCount },
    ...skillCounts
  ];

  const interestFilters = [
    { label: 'All Interests', value: FILTER_ALL, count: totalCount },
    ...interestCounts
  ];

  return (
    <div className={`${cardBaseCompact} mb-6`}>
      {/* Search Input */}
      <div className="mb-6">
        <SearchInput
          label="Search by Name"
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search students by name..."
          debounceMs={300}
        />
      </div>

      {/* Filter Button Groups */}
      {uniqueDepartments.length > 0 && (
        <div className="mb-4">
          <label className={labelStyles}>Department</label>
          <FilterButtons
            filters={departmentFilters}
            activeFilter={filters.department}
            onChange={(value) => handleFilterButtonChange('department', value as string)}
          />
        </div>
      )}

      {uniqueSkills.length > 0 && (
        <div className="mb-4">
          <label className={labelStyles}>Skills</label>
          <FilterButtons
            filters={skillFilters}
            activeFilter={filters.skill}
            onChange={(value) => handleFilterButtonChange('skill', value as string)}
          />
        </div>
      )}

      {uniqueInterests.length > 0 && (
        <div className="mb-4">
          <label className={labelStyles}>Interests</label>
          <FilterButtons
            filters={interestFilters}
            activeFilter={filters.interest}
            onChange={(value) => handleFilterButtonChange('interest', value as string)}
          />
        </div>
      )}

      {/* Clear Filters Button and Results Count */}
      <div className={`flex items-center justify-between ${dividerLight}`}>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={btnSecondary}
          >
            Clear Filters
          </button>
        )}
        
        {filteredCount !== undefined && (
          <p className={`text-sm ${textSecondary} ${hasActiveFilters ? 'ml-auto' : ''}`}>
            Showing <span className={`font-semibold ${textPrimary}`}>{filteredCount}</span> of{' '}
            <span className={`font-semibold ${textPrimary}`}>{totalCount}</span> student{totalCount !== 1 ? 's' : ''}
            {hasActiveFilters && ' matching your filters'}
          </p>
        )}
      </div>
    </div>
  );
}
