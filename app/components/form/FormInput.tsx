import React from 'react';

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
  pattern,
  disabled = false,
  className = '',
}) => {
  const inputId = id || name;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="label-base">
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
        pattern={pattern}
        disabled={disabled}
        className="input-base"
      />
      {helperText && (
        <small className="text-gray-500 text-xs mt-1 block">{helperText}</small>
      )}
    </div>
  );
};

export default FormInput;

