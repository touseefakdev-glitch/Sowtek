import React from 'react';
import { cn } from '@/lib/utils/cn';

const FIELD =
  'w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-ink-subtle transition-colors ' +
  'hover:border-line-strong focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/35 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-ink-muted';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: string;
}

export function Input({ label, hint, error, icon, className, id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  const describedBy = [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-ink-secondary">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[1.125rem] text-ink-subtle"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD, icon && 'pl-9', error && 'border-status-danger focus:border-status-danger focus:ring-status-danger/30', className)}
          {...rest}
        />
      </div>
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-semibold text-status-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({
  label,
  hint,
  error,
  className,
  id,
  children,
  ...rest
}: SelectProps) {
  const selectId = id ?? rest.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-semibold text-ink-secondary">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD, 'appearance-none pr-8', error && 'border-status-danger', className)}
        {...rest}
      >
        {children}
      </select>
      {hint && !error ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-status-danger">{error}</p>
      ) : null}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  const areaId = id ?? rest.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={areaId} className="mb-1.5 block text-xs font-semibold text-ink-secondary">
          {label}
        </label>
      ) : null}
      <textarea
        id={areaId}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD, 'min-h-[5rem] resize-y', error && 'border-status-danger', className)}
        {...rest}
      />
      {hint && !error ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-status-danger">{error}</p>
      ) : null}
    </div>
  );
}
