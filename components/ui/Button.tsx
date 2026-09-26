import React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-navy text-ink-inverse border border-navy hover:bg-navy-900 disabled:bg-ink-subtle disabled:border-ink-subtle',
  secondary:
    'bg-surface text-ink border border-line hover:bg-surface-hover disabled:text-ink-subtle',
  ghost: 'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-hover',
  danger:
    'bg-status-danger text-ink-inverse border border-status-danger hover:brightness-95 disabled:bg-ink-subtle disabled:border-ink-subtle',
};

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Material Symbols ligature rendered before the label. */
  icon?: string;
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'sm',
  icon,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-control font-semibold',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[1rem] leading-none" aria-hidden>
          progress_activity
        </span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[1.125rem] leading-none" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
