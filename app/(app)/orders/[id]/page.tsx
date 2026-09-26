import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchOrderDetail } from '@/lib/data/orders';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { humanize } from '@/lib/domain/status';
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  OrderStatusBadge,
  PageBody,
  PageHeader,
} from '@/components/ui';
import { OrderStatusControl } from './OrderStatusControl';

interface Params {
  params: { id: string };
}

export function generateMetadata({ params }: Params): Metadata {
  return { title: `Order ${params.id.slice(0, 8)}` };
}

/**
 * Server Component. The order, its items and its history are read on the
 * server with the session cookie, so the page is populated on first paint.
 * The only client leaf is OrderStatusControl, which owns the status mutation.
 */
export default async function OrderDetailPage({ params }: Params) {
  // Not wrapped in .catch(): a database failure must surface the error
  // boundary, whereas a genuine miss must render the 404 boundary. Collapsing
  // both into one null value would send missing orders to the error page.
  const order = await fetchOrderDetail(params.id);

  if (!order) notFound();

  const reference = order.order_number || order.id;
  const hasItems = order.items.length > 0;

  return (
    <>
      <PageHeader
        title={reference}
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <Link href="/orders" className="text-ink-secondary hover:text-ink">
              Orders
            </Link>
            <span aria-hidden>/</span>
            <OrderStatusBadge status={order.status} />
            <span>
              Placed {formatDateTime(order.created_at)}
              {order.agent ? ` · Assigned to ${order.agent.full_name}` : ' · Unassigned'}
            </span>
          </span>
        }
        action={
          <div className="text-right">
            <p className="font-mono text-lg font-bold text-ink">
              {formatCurrency(order.total_amount)}
            </p>
            <p className="text-[11px] text-ink-muted">
              {order.payment_terms || 'No payment terms set'}
            </p>
          </div>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <OrderStatusControl order={order} />

            <Card>
              <CardHeader
                title="Line items"
                description={`${order.items.length} ${order.items.length === 1 ? 'line' : 'lines'}`}
              />
              <CardBody>
                {!hasItems ? (
                  <EmptyState
                    icon="inventory_2"
                    title="No line items recorded"
                    description="This order has no products attached to it yet."
                    className="border-0 px-0 py-6"
                  />
                ) : (
                  <div className="-mx-6 overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-left text-xs">
                      <caption className="sr-only">
                        Products on order {reference} with quantity, unit price and line total
                      </caption>
                      <thead>
                        <tr className="border-b border-line uppercase text-ink-subtle">
                          <th scope="col" className="pb-3">Item</th>
                          <th scope="col" className="pb-3">Unit</th>
                          <th scope="col" className="pb-3 text-right">Qty</th>
                          <th scope="col" className="pb-3 text-right">Unit price</th>
                          <th scope="col" className="pb-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <th scope="row" className="py-3 font-semibold text-ink">
                              {item.name}
                            </th>
                            <td className="py-3 text-ink-muted">{item.unit || '—'}</td>
                            <td className="py-3 text-right font-mono">{item.quantity}</td>
                            <td className="py-3 text-right font-mono text-ink-muted">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-ink">
                              {formatCurrency(
                                item.total_price ?? item.quantity * Number(item.unit_price ?? 0)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-line">
                          <th scope="row" colSpan={4} className="pt-3 text-right font-normal text-ink-muted">
                            Subtotal
                          </th>
                          <td className="pt-3 text-right font-mono">{formatCurrency(order.subtotal)}</td>
                        </tr>
                        <tr>
                          <th scope="row" colSpan={4} className="pt-1 text-right font-normal text-ink-muted">
                            VAT
                          </th>
                          <td className="pt-1 text-right font-mono">{formatCurrency(order.vat_amount)}</td>
                        </tr>
                        <tr>
                          <th scope="row" colSpan={4} className="pt-2 text-right font-bold text-ink">
                            Total
                          </th>
                          <td className="pt-2 text-right font-mono font-bold text-ink">
                            {formatCurrency(order.total_amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Status history" />
              <CardBody>
                {order.history.length === 0 ? (
                  <EmptyState
                    icon="history"
                    title="No status changes yet"
                    description="Transitions are recorded here as the order moves through fulfilment."
                    className="border-0 px-0 py-6"
                  />
                ) : (
                  <ol className="space-y-3">
                    {order.history.map((entry) => (
                      <li key={entry.id} className="flex gap-3">
                        <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-pill bg-lime" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink">
                            {entry.from_status ? `${humanize(entry.from_status)} to ` : ''}
                            {humanize(entry.to_status)}
                          </p>
                          {entry.note ? (
                            <p className="mt-0.5 text-[11px] text-ink-muted">{entry.note}</p>
                          ) : null}
                          <p className="mt-0.5 text-[10px] text-ink-subtle">
                            {formatDateTime(entry.created_at)}
                            {entry.changed_by_user ? ` · ${entry.changed_by_user.full_name}` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Customer" />
              <CardBody>
                {order.restaurant ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-sm font-bold text-ink">{order.restaurant.name}</p>
                    {order.restaurant.name_ar ? (
                      <p dir="rtl" lang="ar" className="font-arabic text-[11px] text-ink-subtle">
                        {order.restaurant.name_ar}
                      </p>
                    ) : null}
                    {order.restaurant.whatsapp_number ? (
                      <p className="font-mono text-[11px] text-ink-secondary">
                        {order.restaurant.whatsapp_number}
                      </p>
                    ) : null}
                    {order.restaurant.email ? (
                      <p className="text-[11px] text-ink-muted">{order.restaurant.email}</p>
                    ) : null}
                    {order.restaurant.address ? (
                      <p className="text-[11px] text-ink-muted">{order.restaurant.address}</p>
                    ) : null}
                    {order.restaurant.delivery_zone ? (
                      <p className="text-[11px] text-ink-muted">
                        Zone: {order.restaurant.delivery_zone}
                      </p>
                    ) : null}
                    <Link
                      href={`/contacts/${order.restaurant.id}`}
                      className="mt-3 inline-block text-xs font-semibold text-ink underline underline-offset-2 hover:text-ink-secondary"
                    >
                      View 360° profile
                    </Link>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-subtle">
                    No restaurant is linked to this order.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Delivery" />
              <CardBody>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Delivery date</dt>
                    <dd className="text-right font-semibold text-ink">
                      {formatDate(order.delivery_date)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">SLA deadline</dt>
                    <dd className="text-right font-semibold text-ink">
                      {formatDateTime(order.sla_deadline)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-ink-muted">Address</dt>
                    <dd className="text-right font-semibold text-ink">
                      {order.delivery_address || 'Not set'}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            {order.notes ? (
              <Card>
                <CardHeader title="Notes" />
                <CardBody>
                  <p className="whitespace-pre-wrap text-xs text-ink-secondary">{order.notes}</p>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      </PageBody>
    </>
  );
}
