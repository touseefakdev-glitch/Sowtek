import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchProducts } from '@/lib/data/products';
import { LoadingState } from '@/components/ui';
import { ProductsView } from './ProductsView';

export const metadata: Metadata = { title: 'Product catalog' };

/**
 * Server Component: the catalog is fetched on the server so the first paint
 * includes the inventory. Search and category live in the URL; the client
 * child owns only stock mutations, selection and CSV export.
 */
export default async function ProductCatalogPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; status?: string };
}) {
  const search = searchParams.search ?? '';
  const category = searchParams.category ?? '';
  const status = searchParams.status ?? 'all';

  const catalog = await fetchProducts({
    search: search || undefined,
    category: category || undefined,
    limit: 100,
  }).catch(() => null);

  return (
    <Suspense fallback={<LoadingState label="Loading catalog" />}>
      <ProductsView
        initialProducts={catalog?.products ?? []}
        categories={catalog?.categories ?? []}
        initialSearch={search}
        initialCategory={category}
        initialStatus={status}
      />
    </Suspense>
  );
}
