import Link from 'next/link';
import { Button, EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icon="search_off"
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Link href="/">
            <Button variant="primary" icon="home">
              Go to start
            </Button>
          </Link>
        }
        className="bg-surface"
      />
    </div>
  );
}
