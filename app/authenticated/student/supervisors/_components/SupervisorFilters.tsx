'use client';

import GenericFilters, { FilterFieldConfig } from '@/app/components/filters/GenericFilters';
import { DEPARTMENTS, AVAILABILITY_FILTER_OPTIONS } from '@/lib/constants';

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

const filterFields: FilterFieldConfig[] = [
  {
    name: 'search',
    type: 'search',
    label: 'Search',
    placeholder: 'Search by name, bio, expertise...',
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
    name: 'availability',
    type: 'select',
    label: 'Availability',
    options: [...AVAILABILITY_OPTIONS],
    placeholder: 'All Availability',
    className: 'min-w-[160px]',
    defaultValue: 'all',
  },
  {
    name: 'expertise',
    type: 'text',
    label: 'Expertise Areas',
    placeholder: 'e.g., Machine Learning, Python',
    helperText: 'Separate multiple with commas',
    className: 'flex-1 min-w-[200px]',
  },
  {
    name: 'interests',
    type: 'text',
    label: 'Research Interests',
    placeholder: 'e.g., AI, Data Science',
    helperText: 'Separate multiple with commas',
    className: 'flex-1 min-w-[200px]',
  },
];

const clearFiltersValue: FilterValues = {
  search: '',
  department: 'all',
  availability: 'all',
  expertise: '',
  interests: '',
};

export default function SupervisorFilters({
  filters,
  onFilterChange,
  resultCount,
}: SupervisorFiltersProps) {
  return (
    <GenericFilters
      filters={filters}
      onFilterChange={onFilterChange}
      resultCount={resultCount}
      entityName="supervisor"
      fields={filterFields}
      clearFiltersValue={clearFiltersValue}
    />
  );
}
