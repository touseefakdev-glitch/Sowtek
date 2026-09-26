'use client';

import React from 'react';
import { Button, ErrorState } from '@/components/ui';

/**
 * Route-level error boundary for the authenticated group. Guarantees a failed
 * client fetch surfaces a recoverable message instead of a blank region.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Replace with the project's error reporter when one is configured.
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">
        <ErrorState
          title="This page could not be loaded"
          message={error.message || 'An unexpected error occurred while rendering this view.'}
        />
        <div className="flex justify-end">
          <Button variant="primary" icon="refresh" onClick={reset}>
            Try again
          </Button>
        </div>
        {error.digest ? (
          <p className="text-right text-xs text-ink-subtle">Reference: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
