import React from 'react';
import { labelStyles, inputStyles, helperStyles } from '@/lib/styles/shared-styles';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  id?: string;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  placeholder = 'Select an option',
  helperText,
  disabled = false,
  className = '',
}) => {
  const inputId = id || name;

  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelStyles}>
        {label} {required && '*'}
      </label>
      <select
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={inputStyles}
        data-testid={`form-select-${name}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <small className={helperStyles}>{helperText}</small>
      )}
    </div>
  );
};

export default FormSelect;
