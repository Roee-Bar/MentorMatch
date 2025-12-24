'use client';

import { useState, useEffect, useRef } from 'react';
import { labelStyles, inputStyles, iconMuted } from '@/lib/styles/shared-styles';

interface SearchInputProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number; // Optional debounce (0 = no debounce, default: 0)
  className?: string;
}

/**
 * Reusable search input component with icon and optional debouncing
 * 
 * @example
 * ```tsx
 * <SearchInput
 *   label="Search"
 *   value={searchValue}
 *   onChange={setSearchValue}
 *   placeholder="Search by name..."
 *   debounceMs={300}
 * />
 * ```
 */
export default function SearchInput({
  id,
  name = 'search',
  label,
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 0,
  className = '',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Keep ref updated to avoid stale closures
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync local value with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle debounced onChange (only when debounceMs > 0)
  useEffect(() => {
    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (localValue !== value) {
          onChangeRef.current(localValue);
        }
      }, debounceMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
    // When debounceMs === 0, updates are handled immediately in handleChange
  }, [localValue, debounceMs, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    
    // If no debounce, call onChange immediately
    if (debounceMs === 0) {
      onChange(e.target.value);
    }
  };

  const inputId = id || name;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={labelStyles}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          id={inputId}
          name={name}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${inputStyles} pl-10`}
        />
        <svg
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconMuted}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}

