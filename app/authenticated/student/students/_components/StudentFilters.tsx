'use client';

import GenericFilters, { FilterFieldConfig } from '@/app/components/filters/GenericFilters';
import { DEPARTMENTS } from '@/lib/constants';

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

const filterFields: FilterFieldConfig[] = [
  {
    name: 'search',
    type: 'search',
    label: 'Search',
    placeholder: 'Search by name, skills, interests...',
  },
  {
    name: 'department',
    type: 'select',
    label: 'Department',
    options: [...DEPARTMENTS],
    placeholder: 'All Departments',
    className: 'min-w-[180px]',
    defaultValue: 'all',
  },
  {
    name: 'skills',
    type: 'text',
    label: 'Skills',
    placeholder: 'e.g., Python, React, Machine Learning',
    helperText: 'Separate multiple with commas',
    className: 'flex-1 min-w-[200px]',
  },
  {
    name: 'interests',
    type: 'text',
    label: 'Interests',
    placeholder: 'e.g., AI, Web Development, Data Science',
    helperText: 'Separate multiple with commas',
    className: 'flex-1 min-w-[200px]',
  },
];

const clearFiltersValue: FilterValues = {
  search: '',
  department: 'all',
  skills: '',
  interests: '',
};

export default function StudentFilters({
  filters,
  onFilterChange,
  resultCount,
}: StudentFiltersProps) {
  return (
    <GenericFilters
      filters={filters}
      onFilterChange={onFilterChange}
      resultCount={resultCount}
      entityName="student"
      fields={filterFields}
      clearFiltersValue={clearFiltersValue}
    />
  );
}

