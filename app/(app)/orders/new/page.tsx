import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchContacts } from '@/lib/data/contacts';
import { fetchProducts } from '@/lib/data/products';
import { PageBody, PageHeader } from '@/components/ui';
import { OrderBuilder } from './OrderBuilder';

export const metadata: Metadata = { title: 'New order' };

/**
 * Server Component. Restaurants and products are reference data every order
 * builder needs, so they are read here in parallel and handed to the form as
 * props. Previously the form fetched both from useEffect behind a spinner,
 * which also meant a failed reference load silently produced an empty
 * catalogue with no way to retry.
 */
export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: { restaurant_id?: string };
}) {
  const [contactResult, productResult] = await Promise.allSettled([
    fetchContacts({ limit: 100 }),
    fetchProducts({ limit: 100 }),
  ]);

  const restaurants = contactResult.status === 'fulfilled' ? contactResult.value : [];
  const products = productResult.status === 'fulfilled' ? productResult.value.products : [];

  // Only surface a failure if it actually cost the agent something: an empty
  // catalogue or an empty restaurant list is visible on its own.
  const failures: string[] = [];
  if (restaurants.length === 0) failures.push('restaurants');
  if (products.length === 0) failures.push('products');

  const referenceError =
    failures.length > 0
      ? `Could not load ${failures.join(' or ')} from the database. Check your connection, then reload before creating the order.`
      : null;

  return (
    <>
      <PageHeader
        title="Create wholesale order"
        description={
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/orders" className="text-ink-secondary hover:text-ink">
              Orders
            </Link>
            <span aria-hidden>/</span>
            <span>New order</span>
          </span>
        }
        action={
          <Link
            href="/orders"
            className="rounded-control border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            Cancel
          </Link>
        }
      />

      <PageBody>
        <OrderBuilder
          restaurants={restaurants}
          products={products}
          preselectedRestaurantId={searchParams.restaurant_id ?? null}
          referenceError={referenceError}
        />
      </PageBody>
    </>
  );
}
