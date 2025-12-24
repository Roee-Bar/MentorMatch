'use client';

/**
 * lib/hooks/useStudentPartnershipFilters.ts
 * Hook for managing student partnership filtering logic
 */

import { useMemo, useCallback } from 'react';
import type { Student } from '@/types/database';
import { useFilterState } from './useFilterState';
import { extractUniqueValues, parseCommaSeparatedString, calculateFilterCounts, createStudentFilterPredicate } from '@/lib/utils/filter-utils';
import type { FilterOption } from '@/lib/utils/filter-types';

export interface StudentPartnershipFilters {
  search: string;
  department: string; // 'all' or specific department
  skill: string; // 'all' or specific skill
  interest: string; // 'all' or specific interest
}

const DEFAULT_FILTERS: StudentPartnershipFilters = {
  search: '',
  department: 'all',
  skill: 'all',
  interest: 'all',
};

/**
 * Hook for managing student partnership filters
 * 
 * @param students - Array of students to filter
 * @returns Filter state, filtered students, unique values, and filter management functions
 * 
 * @example
 * ```typescript
 * const {
 *   filters,
 *   filteredStudents,
 *   uniqueDepartments,
 *   uniqueSkills,
 *   uniqueInterests,
 *   updateFilter,
 *   clearFilters,
 *   hasActiveFilters,
 * } = useStudentPartnershipFilters(availableStudents);
 * ```
 */
export function useStudentPartnershipFilters(students: Student[] = []) {
  // Filter state management
  const {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  } = useFilterState<StudentPartnershipFilters>(DEFAULT_FILTERS);

  // Extract unique departments (normalized for matching, but keep original case for display)
  const uniqueDepartments = useMemo(() => {
    return extractUniqueValues(
      students,
      (student) => student.department,
      { sort: true }
    );
  }, [students]);

  // Extract unique skills (normalized for matching, capitalized for display)
  const uniqueSkills = useMemo(() => {
    const allSkills = students.flatMap(student => {
      return parseCommaSeparatedString(student.skills, {
        normalize: true,
        capitalize: true,
      });
    });
    return Array.from(new Set(allSkills)).sort();
  }, [students]);

  // Extract unique interests (normalized for matching, capitalized for display)
  const uniqueInterests = useMemo(() => {
    const allInterests = students.flatMap(student => {
      return parseCommaSeparatedString(student.interests, {
        normalize: true,
        capitalize: true,
      });
    });
    return Array.from(new Set(allInterests)).sort();
  }, [students]);

  // Create filter predicate using shared utility
  const filterPredicate = useMemo(() => {
    return createStudentFilterPredicate(filters);
  }, [filters]);

  // Filter students based on active filters
  const filteredStudents = useMemo(() => {
    return students.filter(filterPredicate);
  }, [students, filterPredicate]);

  /**
   * Get filter counts for a specific filter type
   * Excludes the filter being counted from the predicate
   * 
   * @param filterType - The filter type to get counts for
   * @returns Array of filter options with counts
   */
  const getFilterCounts = useCallback((
    filterType: 'department' | 'skill' | 'interest'
  ): FilterOption[] => {
    // Create predicate that excludes the filter being counted
    const predicate = createStudentFilterPredicate(filters, filterType);
    
    let filterOptions: string[];
    let getValue: (student: Student) => string | string[];

    switch (filterType) {
      case 'department':
        filterOptions = uniqueDepartments;
        getValue = (student) => student.department;
        break;
      case 'skill':
        filterOptions = uniqueSkills;
        getValue = (student) => parseCommaSeparatedString(student.skills, { normalize: true });
        break;
      case 'interest':
        filterOptions = uniqueInterests;
        getValue = (student) => parseCommaSeparatedString(student.interests, { normalize: true });
        break;
    }

    return calculateFilterCounts(
      students,
      filterOptions,
      getValue,
      predicate
    );
  }, [students, filters, uniqueDepartments, uniqueSkills, uniqueInterests]);

  return {
    filters,
    filteredStudents,
    uniqueDepartments,
    uniqueSkills,
    uniqueInterests,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    getFilterCounts,
  };
}

