import React from 'react';
import clsx from 'clsx';

interface Option {
  value: string;
  label: string;
}

interface SelectPropsWithOptions extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
  children?: never;
}

interface SelectPropsWithChildren extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  children: React.ReactNode;
  options?: never;
}

type SelectProps = SelectPropsWithOptions | SelectPropsWithChildren;

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  placeholder,
  className,
  id,
  children,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'form-input',
          {
            'border-red-300 focus:ring-red-500 focus:border-red-500': error,
          },
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children || ('options' in props && props.options ? props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )) : null)}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};