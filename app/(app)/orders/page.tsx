import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchOrders } from '@/lib/data/orders';
import { LoadingState } from '@/components/ui';
import { OrdersView } from './OrdersView';

export const metadata: Metadata = { title: 'Orders' };

/**
 * Server Component: resolves the initial order list on the server so the first
 * paint already contains data. Filtering and other interactions live in the
 * client child, and the URL carries the filter state.
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const status = searchParams.status ?? '';
  const search = searchParams.search ?? '';

  const result = await fetchOrders({
    status: status || undefined,
    search: search || undefined,
    limit: 50,
  }).catch(() => null);

  return (
    <Suspense fallback={<LoadingState label="Loading orders" />}>
      <OrdersView
        initialOrders={result?.orders ?? []}
        initialCount={result?.count ?? 0}
        initialStatus={status}
        initialSearch={search}
      />
    </Suspense>
  );
}
