import React from 'react';
import { cn } from '@/lib/utils/cn';

const SIZES = {
  sm: 'text-[1rem]',
  md: 'text-[1.125rem]',
  lg: 'text-[1.5rem]',
  xl: 'text-[2rem]',
} as const;

/**
 * The app's only icon renderer. Keeping every glyph behind this component
 * means one font, one optical size and one accessibility policy across the
 * whole product instead of inline SVG paths mixed with bare ligature spans.
 *
 * Decorative by default. Pass a `label` only for icon-only controls, which
 * then get an accessible name.
 */
export function Icon({
  name,
  size = 'md',
  filled = false,
  label,
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  filled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn('material-symbols-outlined leading-none', filled && 'fill', SIZES[size], className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {name}
    </span>
  );
}
