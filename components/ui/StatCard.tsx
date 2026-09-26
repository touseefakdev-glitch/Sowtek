import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from './Card';
import { Skeleton } from './Feedback';
import type { Tone } from '@/lib/domain/status';

const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-ink',
  info: 'text-status-info',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
};

const TONE_ICON: Record<Tone, string> = {
  neutral: 'text-ink-subtle',
  info: 'text-status-info',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
};

/**
 * A dashboard KPI. The value colour is driven by a semantic tone rather than
 * an arbitrary hue, so the same tone always means the same thing.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  loading = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: string;
  tone?: Tone;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('px-5 py-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-subtle">{label}</span>
        {icon ? (
          <span
            className={cn('material-symbols-outlined text-[1.25rem] leading-none', TONE_ICON[tone])}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <div className={cn('mt-2 text-3xl font-bold tabular-nums', TONE_TEXT[tone])}>{value}</div>
      )}
      {hint ? <div className="mt-1 block text-xs text-ink-muted">{hint}</div> : null}
    </Card>
  );
}
