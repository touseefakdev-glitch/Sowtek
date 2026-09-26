import React from 'react';
import { cn } from '@/lib/utils/cn';
import { toneClasses, toneDot, type Tone } from '@/lib/domain/status';

export function Badge({
  tone = 'neutral',
  children,
  icon,
  dot = false,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  icon?: string;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold',
        toneClasses(tone),
        className
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-pill', toneDot(tone))} aria-hidden /> : null}
      {icon ? (
        <span className="material-symbols-outlined text-[0.875rem] leading-none" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
