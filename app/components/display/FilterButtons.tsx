import React from 'react';

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
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeFilter === filter.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;

