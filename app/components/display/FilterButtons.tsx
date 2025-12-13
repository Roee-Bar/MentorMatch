import React from 'react';
import { filterBtnActive, filterBtnInactive } from '@/lib/styles/shared-styles';

interface Filter {
  label: string;
  value: string;
  count: number;
}

interface FilterButtonsProps {
  filters: Filter[];
  activeFilter: string;
  onChange: (value: string) => void;
  className?: string;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  filters,
  activeFilter,
  onChange,
  className = '',
}) => {
  return (
    <div className={`mb-6 flex flex-wrap gap-3 ${className}`}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={activeFilter === filter.value ? filterBtnActive : filterBtnInactive}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;

