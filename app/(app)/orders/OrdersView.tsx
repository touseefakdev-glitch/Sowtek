'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  OrderStatusBadge,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { getOrders } from '@/lib/api/orders';
import { ORDER_STATUSES, ORDER_STATUS_META } from '@/lib/domain/status';
import type { OrderListItem } from '@/lib/data/orders';
import { formatCurrency, formatDate } from '@/lib/format';

interface OrdersViewProps {
  initialOrders: OrderListItem[];
  initialStatus: string;
  initialSearch: string;
  initialCount: number;
}

export function OrdersView({
  initialOrders,
  initialStatus,
  initialSearch,
  initialCount,
}: OrdersViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<OrderListItem[]>(initialOrders);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refetch when the filters change. The URL is the source of truth for filter
  // state, so a filtered view is shareable and survives a refresh.
  useEffect(() => {
    const nextStatus = searchParams.get('status') ?? '';
    const nextSearch = searchParams.get('search') ?? '';
    if (nextStatus === status && nextSearch === search) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getOrders({ status: nextStatus || undefined, search: nextSearch || undefined, limit: 50 })
      .then((res) => setOrders((res.data ?? []) as OrderListItem[]))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setOrders([]);
        setError(err instanceof Error ? err.message : 'Unable to load orders.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [searchParams, status, search]);

  const applyFilters = useCallback(
    (next: { status?: string; search?: string }) => {
      const params = new URLSearchParams();
      const merged = { status: next.status ?? status, search: next.search ?? search };
      if (merged.status) params.set('status', merged.status);
      if (merged.search) params.set('search', merged.search);
      const query = params.toString();
      router.replace(query ? `/orders?${query}` : '/orders', { scroll: false });
    },
    [router, search, status]
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track and fulfil restaurant wholesale orders"
        action={
          <Link href="/orders/new">
            <Button variant="primary" icon="add">
              New order
            </Button>
          </Link>
        }
      />

      <div className="w-full max-w-content flex-1 px-6 py-6">
        <form
          className="mb-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters({});
          }}
        >
          <Input
            name="search"
            icon="search"
            placeholder="Search by order number or notes"
            aria-label="Search orders"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              applyFilters({ search: event.target.value });
            }}
            className="sm:max-w-md"
          />
          <Select
            name="status"
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              applyFilters({ status: event.target.value });
            }}
            className="sm:max-w-56"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_META[value].label}
              </option>
            ))}
          </Select>
        </form>

        {error ? <ErrorState message={error} className="mb-6" /> : null}

        <Card className="overflow-hidden">
          {loading && orders.length === 0 ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="No orders found"
              description={
                search || status
                  ? 'No orders match the current filters. Try widening your search.'
                  : 'Orders will appear here once they are created.'
              }
              action={
                search || status ? (
                  <Button
                    icon="filter_alt_off"
                    onClick={() => {
                      setSearch('');
                      setStatus('');
                      router.replace('/orders', { scroll: false });
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Link href="/orders/new">
                    <Button variant="primary" icon="add">
                      Create the first order
                    </Button>
                  </Link>
                )
              }
              className="m-6 border-0"
            />
          ) : (
            <Table>
              <caption className="sr-only">
                {orders.length} of {initialCount} orders
              </caption>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Restaurant</TH>
                  <TH>Delivery date</TH>
                  <TH align="right">Total</TH>
                  <TH>Status</TH>
                  <TH align="right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {orders.map((order) => (
                  <TR key={order.id}>
                    <TD className="font-semibold text-ink">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.order_number || order.id.slice(0, 8)}
                      </Link>
                    </TD>
                    <TD>{order.restaurant?.name ?? 'Unknown restaurant'}</TD>
                    <TD>{order.delivery_date ? formatDate(order.delivery_date) : 'Not set'}</TD>
                    <TD align="right" className="font-semibold tabular-nums text-ink">
                      {formatCurrency(order.total_amount)}
                    </TD>
                    <TD>
                      <OrderStatusBadge status={order.status} />
                    </TD>
                    <TD align="right">
                      <Link href={`/orders/${order.id}`}>
                        <Button icon="arrow_forward">Open</Button>
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
