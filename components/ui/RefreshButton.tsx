'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';

/**
 * Re-runs the server component for the current route. The dashboard is now
 * rendered on the server, so refreshing is a router refresh rather than a
 * client-side refetch.
 */
export function RefreshButton({ label = 'Refresh' }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      icon="refresh"
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        setPending(true);
        router.refresh();
        // The refresh is fire-and-forget; clear the spinner once React commits.
        setTimeout(() => setPending(false), 600);
      }}
    >
      {label}
    </Button>
  );
}
