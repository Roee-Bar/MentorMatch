import React from 'react';
import { labelStyles, textareaStyles, helperStyles, charCounterStyles } from '@/lib/styles/shared-styles';

interface FormTextAreaProps {
  id?: string;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  disabled?: boolean;
  className?: string;
}

const FormTextArea: React.FC<FormTextAreaProps> = ({
  id,
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  helperText,
  rows = 3,
  maxLength,
  showCharCount = false,
  disabled = false,
  className = '',
}) => {
  const inputId = id || name;

  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelStyles}>
        {label} {required && '*'}
      </label>
      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={textareaStyles}
      />
      <div className="flex items-center justify-between mt-1">
        {helperText && (
          <small className={helperStyles}>{helperText}</small>
        )}
        {showCharCount && maxLength && (
          <small className={charCounterStyles}>
            {value.length}/{maxLength}
          </small>
        )}
      </div>
    </div>
  );
};

export default FormTextArea;
