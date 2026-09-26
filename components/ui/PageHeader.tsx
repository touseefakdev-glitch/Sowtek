import React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Page chrome: a single h1 per page, a subtitle, and a right-aligned action
 * slot. Previously each page invented its own header bar.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-6 py-4',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PageBody({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('w-full max-w-content flex-1 px-6 py-6', className)} {...rest}>
      {children}
    </div>
  );
}
