import React from 'react';
import { labelStyles, helperStyles } from '@/lib/styles/shared-styles';

interface SelectOption {
  value: string;
  label: string;
}

interface FormMultiSelectProps {
  id?: string;
  label: string;
  name: string;
  value: string[]; // Array of selected values
  onChange: (selected: string[]) => void;
  options: SelectOption[];
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  maxSelections?: number;
}

const FormMultiSelect: React.FC<FormMultiSelectProps> = ({
  id,
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  helperText,
  disabled = false,
  className = '',
  maxSelections,
}) => {
  const inputId = id || name;

  const handleToggle = (optionValue: string) => {
    if (disabled) return;
    
    if (value.includes(optionValue)) {
      // Remove from selection
      onChange(value.filter(v => v !== optionValue));
    } else {
      // Add to selection (check max limit)
      if (!maxSelections || value.length < maxSelections) {
        onChange([...value, optionValue]);
      }
    }
  };

  return (
    <div className={`${className} px-4`}>
      <label htmlFor={inputId} className={labelStyles}>
        {label} {required && '*'}
      </label>
      
      <div className="border border-gray-300 rounded-xl p-4 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 dark:border-slate-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center p-2 rounded-lg cursor-pointer transition-colors
                ${value.includes(option.value) 
                  ? 'bg-blue-50 border border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' 
                  : 'hover:bg-gray-50 border border-transparent dark:hover:bg-slate-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                disabled={disabled || (maxSelections && value.length >= maxSelections && !value.includes(option.value))}
                className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-blue-600 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-gray-700 dark:text-slate-200">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-2">
        {value.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-1 px-4">
            Selected: {value.length}
            {maxSelections && ` / ${maxSelections}`}
          </div>
        )}
        {helperText && (
          <small className={helperStyles}>{helperText}</small>
        )}
      </div>
    </div>
  );
};

export default FormMultiSelect;
