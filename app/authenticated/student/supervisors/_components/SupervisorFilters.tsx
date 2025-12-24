'use client';

import FormInput from '@/app/components/form/FormInput';
import FormSelect from '@/app/components/form/FormSelect';
import SearchInput from '@/app/components/form/SearchInput';
import { DEPARTMENTS, AVAILABILITY_FILTER_OPTIONS } from '@/lib/constants';
import { btnSecondary, cardBaseCompact, dividerLight, textSecondary, textPrimary } from '@/lib/styles/shared-styles';

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
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

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
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            label="Search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by name, bio, expertise..."
            debounceMs={300}
          />
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
          <p className={`text-sm ${textSecondary}`}>
            Showing <span className={`font-semibold ${textPrimary}`}>{resultCount}</span> supervisor{resultCount !== 1 ? 's' : ''}
            {hasActiveFilters && ' matching your filters'}
          </p>
        </div>
      )}
    </div>
  );
}
