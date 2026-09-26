'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toggleAvailability } from '@/lib/api/products';
import type { ProductRow } from '@/lib/data/products';
import { STOCK_STATUS_META } from '@/lib/domain/status';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StockBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { formatCurrency } from '@/lib/format';

type StatusFilter = 'all' | 'available' | 'low' | 'out_of_stock';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'low', label: 'Low stock' },
  { id: 'out_of_stock', label: 'Out of stock' },
];

interface ProductsViewProps {
  initialProducts: ProductRow[];
  categories: string[];
  initialCategory: string;
  initialSearch: string;
  initialStatus: string;
}

export function ProductsView({
  initialProducts,
  categories,
  initialCategory,
  initialSearch,
  initialStatus,
}: ProductsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState<StatusFilter>(
    STATUS_TABS.some((tab) => tab.id === initialStatus) ? (initialStatus as StatusFilter) : 'all'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Server-side search and category filtering. The status tab stays client-side
  // because it is a pure view filter over the rows already loaded.
  useEffect(() => {
    const nextSearch = searchParams.get('search') ?? '';
    const nextCategory = searchParams.get('category') ?? '';
    if (nextSearch === search && nextCategory === category) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    if (nextCategory) params.set('category', nextCategory);

    const query = params.toString();
    fetch(`/api/products?${query}${query ? '&' : ''}limit=100`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || json.error) {
          throw new Error(json.error?.message || 'Unable to load the product catalog.');
        }
        return json.data as ProductRow[];
      })
      .then((rows) => setProducts(rows ?? []))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setProducts([]);
        setError(err instanceof Error ? err.message : 'Unable to load the product catalog.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [searchParams, search, category]);

  const pushFilters = useCallback(
    (next: { search?: string; category?: string }) => {
      const params = new URLSearchParams();
      const merged = { search: next.search ?? search, category: next.category ?? category };
      if (merged.search) params.set('search', merged.search);
      if (merged.category) params.set('category', merged.category);
      const query = params.toString();
      router.replace(query ? `/products?${query}` : '/products', { scroll: false });
    },
    [router, search, category]
  );

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: products.length,
      available: 0,
      low: 0,
      out_of_stock: 0,
    };
    for (const product of products) {
      if (product.stock_status in counts) {
        counts[product.stock_status as StatusFilter] += 1;
      }
    }
    return result;
  }, [products]);

  const visible = useMemo(
    () => (status === 'all' ? products : products.filter((p) => p.stock_status === status)),
    [products, status]
  );

  const allVisibleSelected = visible.length > 0 && selectedIds.length === visible.length;

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleToggleStock = async (id: string, current: ProductRow['stock_status']) => {
    const next = current === 'available' ? 'out_of_stock' : 'available';
    setBusyId(id);
    setRowError(null);
    try {
      await toggleAvailability(id, next);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stock_status: next, is_active: next === 'available' } : p
        )
      );
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'The stock status could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const header = ['sku', 'name', 'name_ar', 'category', 'unit', 'price', 'stock_status', 'is_active'];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = visible.map((p) =>
      [p.sku, p.name, p.name_ar, p.category, p.unit, p.price, p.stock_status, p.is_active]
        .map(escape)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sowtek-products-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Product catalog"
        description="Inventory and wholesale SKU management"
        action={
          <Button icon="file_download" onClick={handleExportCsv} disabled={visible.length === 0}>
            Export CSV
          </Button>
        }
      />

      <div className="w-full max-w-content flex-1 px-6 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              aria-pressed={status === tab.id}
              className={
                status === tab.id
                  ? 'rounded-card border border-ink bg-ink px-4 py-3 text-left transition'
                  : 'rounded-card border border-line bg-surface px-4 py-3 text-left transition hover:bg-surface-sunken'
              }
            >
              <span
                className={
                  status === tab.id
                    ? 'block text-[10px] font-bold uppercase tracking-wider text-ink-muted'
                    : 'block text-[10px] font-bold uppercase tracking-wider text-ink-subtle'
                }
              >
                {tab.label}
              </span>
              <span
                className={
                  status === tab.id
                    ? 'mt-1 block text-xl font-bold tabular-nums text-white'
                    : 'mt-1 block text-xl font-bold tabular-nums text-ink'
                }
              >
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input
            name="search"
            icon="search"
            type="search"
            aria-label="Search the catalog"
            placeholder="Search by name, SKU or category"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pushFilters({ search: event.target.value });
            }}
            className="sm:max-w-md"
          />
          <Select
            name="category"
            aria-label="Filter by category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              pushFilters({ category: event.target.value });
            }}
            className="sm:max-w-56"
          >
            <option value="">All categories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>

        {error ? <ErrorState message={error} className="mb-4" /> : null}
        {rowError ? (
          <p
            role="alert"
            className="mb-4 rounded-control border border-status-warning/30 bg-status-warning-bg px-3 py-2 text-[11px] font-semibold text-status-warning"
          >
            {rowError}
          </p>
        ) : null}

        <Card className="overflow-hidden">
          {loading && products.length === 0 ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon="inventory_2"
              title="No products found"
              description={
                search || category
                  ? 'No products match the current filters.'
                  : 'No products in the catalog yet. Products added to the database appear here.'
              }
              className="border-0"
            />
          ) : (
            <Table>
              <caption className="sr-only">
                {visible.length} products, showing stock status and wholesale price
              </caption>
              <THead>
                <TR>
                  <TH className="w-12 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all visible products"
                      checked={allVisibleSelected}
                      onChange={() =>
                        setSelectedIds(allVisibleSelected ? [] : visible.map((p) => p.id))
                      }
                      className="h-4 w-4 cursor-pointer rounded accent-lime"
                    />
                  </TH>
                  <TH>Product</TH>
                  <TH>SKU</TH>
                  <TH>Category</TH>
                  <TH>Unit</TH>
                  <TH align="right">Wholesale price</TH>
                  <TH>Stock</TH>
                  <TH align="right">Availability</TH>
                </TR>
              </THead>
              <TBody>
                {visible.map((product) => {
                  const selected = selectedIds.includes(product.id);
                  const available = product.stock_status === 'available';
                  return (
                    <TR key={product.id} className={selected ? 'bg-lime-tint/50' : undefined}>
                      <TD className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select ${product.name}`}
                          checked={selected}
                          onChange={() => handleToggleRow(product.id)}
                          className="h-4 w-4 cursor-pointer rounded accent-lime"
                        />
                      </TD>
                      <TD>
                        <span className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-ink-muted"
                          >
                            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-xs font-bold text-ink">{product.name}</span>
                            {product.name_ar ? (
                              <span
                                lang="ar"
                                dir="rtl"
                                className="truncate font-arabic text-[11px] text-ink-muted"
                              >
                                {product.name_ar}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </TD>
                      <TD>
                        {product.sku ? (
                          <Badge tone="neutral">{product.sku}</Badge>
                        ) : (
                          <span className="text-ink-subtle">&mdash;</span>
                        )}
                      </TD>
                      <TD className="font-medium text-ink-muted">
                        {product.category || <span className="text-ink-subtle">&mdash;</span>}
                      </TD>
                      <TD className="font-medium text-ink-muted">{product.unit || '—'}</TD>
                      <TD align="right" className="font-bold tabular-nums text-ink">
                        {formatCurrency(product.price)}
                      </TD>
                      <TD>
                        <StockBadge status={product.stock_status} />
                      </TD>
                      <TD align="right">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={available}
                          disabled={busyId === product.id}
                          aria-label={`${product.name}: ${STOCK_STATUS_META[product.stock_status]?.label ?? product.stock_status}`}
                          onClick={() => void handleToggleStock(product.id, product.stock_status)}
                          className={
                            available
                              ? 'inline-flex h-5 w-9 items-center rounded-pill bg-lime p-0.5 transition disabled:opacity-50'
                              : 'inline-flex h-5 w-9 items-center rounded-pill bg-line-strong p-0.5 transition disabled:opacity-50'
                          }
                        >
                          <span
                            aria-hidden
                            className={
                              available
                                ? 'h-4 w-4 translate-x-4 rounded-pill bg-white shadow-subtle transition-transform'
                                : 'h-4 w-4 translate-x-0 rounded-pill bg-white shadow-subtle transition-transform'
                            }
                          />
                        </button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>

        <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
          Showing <span className="font-bold text-ink">{visible.length}</span> of{' '}
          <span className="font-bold text-ink">{products.length}</span> items
          {selectedIds.length > 0 ? (
            <>
              {' · '}
              <span className="font-bold text-lime-700">{selectedIds.length} selected</span>
            </>
          ) : null}
        </p>
      </div>
    </>
  );
}
