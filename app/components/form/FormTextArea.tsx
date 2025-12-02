import React from 'react';

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
      <label htmlFor={inputId} className="label-base">
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
        className="textarea-base"
      />
      <div className="flex justify-between items-center mt-1">
        {helperText && (
          <small className="text-gray-500 text-xs">{helperText}</small>
        )}
        {showCharCount && maxLength && (
          <small className="text-gray-400 text-xs ml-auto">
            {value.length}/{maxLength}
          </small>
        )}
      </div>
    </div>
  );
};

export default FormTextArea;


