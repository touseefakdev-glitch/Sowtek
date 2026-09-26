import React from 'react';
import Link from 'next/link';
import { Button, EmptyState } from '@/components/ui';

export default function AppNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon="search_off"
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Link href="/inbox">
            <Button variant="primary" icon="arrow_back">
              Back to inbox
            </Button>
          </Link>
        }
        className="bg-surface"
      />
    </div>
  );
}
