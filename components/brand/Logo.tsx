import React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * The Sowtek mark. Kept as one component so the brand lockup is defined once
 * instead of being re-drawn per page.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        aria-hidden
        className="flex h-10 w-10 items-center justify-center rounded-control bg-ink text-white shadow-card"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 8C4 5.79086 5.79086 4 8 4H10C11.1046 4 12 4.89543 12 6V8C12 9.10457 11.1046 10 10 10H6C4.89543 10 4 10.8954 4 12V14C4 15.1046 4.89543 16 6 16H8C9.10457 16 10 16.8954 10 18V20H8C5.79086 20 4 18.2091 4 16V8Z"
            fill="currentColor"
          />
          <path
            d="M20 16C20 18.2091 18.2091 20 16 20H14C12.8954 20 12 19.1046 12 18V16C12 14.8954 12.8954 14 14 14H18C19.1046 14 20 13.1046 20 12V10C20 8.89543 19.1046 8 18 8H16C14.8954 8 14 7.10457 14 6V4H16C18.2091 4 20 5.79086 20 8V16Z"
            fill="#70b928"
          />
        </svg>
      </span>

      {showWordmark ? (
        <span className="flex flex-col">
          <span className="text-xl font-black leading-none tracking-tight text-ink">sowtek</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-lime-700">
            OrderFlow
          </span>
        </span>
      ) : null}
    </span>
  );
}
