'use client';

import { forwardRef, useId } from 'react';

interface QuizInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const QuizInput = forwardRef<HTMLInputElement, QuizInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = props.id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          ref={ref}
          className={`w-full rounded-xl px-4 py-4 text-base outline-none transition-all duration-200 ${className}`}
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
            color: 'var(--color-text)',
          }}
          onFocus={e => {
            if (!error) {
              e.target.style.borderColor = 'var(--color-accent)';
              e.target.style.boxShadow = '0 0 0 1px var(--color-accent)';
            }
          }}
          onBlur={e => {
            if (!error) {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'none';
            }
          }}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm mt-1.5" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
QuizInput.displayName = 'QuizInput';

export default QuizInput;
