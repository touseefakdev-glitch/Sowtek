import React from 'react';
import { PageHeader } from '@/components/ui';

/**
 * Route-level loading boundary. Streams in before the page's own data
 * resolves, so navigation never shows an empty shell.
 */
export default function AppLoading() {
  return (
    <>
      <PageHeader title="Loading" description="Fetching the latest records." />
      <div className="w-full max-w-content flex-1 px-6 py-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-card border border-line bg-surface"
              aria-hidden
            />
          ))}
        </div>
        <div
          className="mt-6 h-72 animate-pulse rounded-card border border-line bg-surface"
          aria-hidden
        />
      </div>
    </>
  );
}
