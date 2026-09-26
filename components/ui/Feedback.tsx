import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';

/** Text placeholder used while a metric is loading. Replaces ad hoc '--'. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-control bg-surface-hover', className)}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * The single empty state for the app. Every list view uses this so an empty
 * database always explains itself the same way instead of showing a blank
 * region.
 */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong px-6 py-12 text-center',
        className
      )}
    >
      <span
        className="material-symbols-outlined text-[2rem] leading-none text-ink-subtle"
        aria-hidden
      >
        {icon}
      </span>
      <p className="mt-3 text-sm font-bold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-card border border-status-danger/30 bg-status-danger-bg px-4 py-3',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <span
          className="material-symbols-outlined text-[1.25rem] leading-none text-status-danger"
          aria-hidden
        >
          error
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-status-danger">{title}</p>
          {message ? <p className="mt-0.5 text-sm text-ink-secondary">{message}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10" role="status">
      <span
        className="material-symbols-outlined animate-spin text-[1.25rem] leading-none text-ink-subtle"
        aria-hidden
      >
        progress_activity
      </span>
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
