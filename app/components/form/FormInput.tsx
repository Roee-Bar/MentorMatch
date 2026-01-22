import React from 'react';
import { labelStyles, inputStyles, helperStyles } from '@/lib/styles/shared-styles';

interface FormInputProps {
  id?: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  disabled?: boolean;
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  placeholder,
  helperText,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  disabled = false,
  className = '',
}) => {
  const inputId = id || name;

  return (
    <div className={`${className} px-4`}>
      <label htmlFor={inputId} className={labelStyles}>
        {label} {required && '*'}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        min={min}
        max={max}
        pattern={pattern}
        disabled={disabled}
        className={inputStyles}
      />
      {helperText && (
        <small className={helperStyles}>{helperText}</small>
      )}
    </div>
  );
};

export default FormInput;
