import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProfile360 } from '@/lib/data/contacts';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  OrderStatusBadge,
  PageBody,
  PageHeader,
  PriorityBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TicketStatusBadge,
} from '@/components/ui';
import { humanize } from '@/lib/domain/status';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Restaurant profile' };

function MetricRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control bg-surface-sunken px-3 py-2.5 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span className={tone ? `font-bold tabular-nums ${tone}` : 'font-bold tabular-nums text-ink'}>
        {value}
      </span>
    </div>
  );
}

/**
 * Server Component: the profile used to be five sequential client fetches
 * behind a full-page spinner. It now resolves in a single server pass, so the
 * page arrives populated.
 */
export default async function Restaurant360Page({ params }: { params: { id: string } }) {
  const profile = await fetchProfile360(params.id).catch(() => null);

  if (profile === null) {
    // Distinguish "query failed" from "no such restaurant" is not observable
    // here, so an absent profile is treated as not found and the error case is
    // handled by the route-level error boundary.
    notFound();
  }

  const { restaurant, payment } = profile;

  return (
    <>
      <PageHeader
        title={restaurant.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Link href="/contacts" className="hover:underline">
              Restaurants
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-muted">{restaurant.delivery_zone || 'No zone set'}</span>
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/inbox">
              <Button icon="chat">WhatsApp chat</Button>
            </Link>
            <Link href={`/orders/new?restaurant_id=${restaurant.id}`}>
              <Button variant="primary" icon="add">
                Create order
              </Button>
            </Link>
          </div>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Credit and spend" />
              <CardBody className="space-y-3 text-xs">
                <MetricRow label="Credit limit" value={formatCurrency(payment.creditLimit)} />
                <MetricRow
                  label="Available credit"
                  value={formatCurrency(payment.availableCredit)}
                  tone="text-lime-700"
                />
                <MetricRow
                  label="Outstanding balance"
                  value={formatCurrency(payment.outstandingBalance)}
                  tone={
                    payment.outstandingBalance > 0
                      ? 'text-status-warning'
                      : 'text-status-success'
                  }
                />
                <MetricRow label="Lifetime spend" value={formatCurrency(payment.lifetimeSpend)} />
                <MetricRow label="Payment terms" value={payment.paymentTerms} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Kitchen and procurement contacts" />
              <CardBody>
                {profile.contacts.length === 0 ? (
                  <p className="rounded-card border border-dashed border-line-strong px-4 py-6 text-center text-[11px] text-ink-subtle">
                    No contacts recorded for this account.
                  </p>
                ) : (
                  <ul className="space-y-3 text-xs">
                    {profile.contacts.map((contact) => (
                      <li
                        key={contact.id}
                        className="rounded-card border border-line bg-surface-sunken px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-ink">{contact.full_name}</span>
                          {contact.is_primary ? <Badge tone="success">Primary</Badge> : null}
                        </div>
                        {contact.role ? (
                          <p className="mt-0.5 text-[11px] text-ink-muted">{contact.role}</p>
                        ) : null}
                        {contact.phone ? (
                          <p className="mt-1 font-mono text-[11px] text-ink-muted">
                            {contact.phone}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader
                title="Order history"
                action={
                  <Link href="/orders" className="text-xs font-bold text-lime-700 hover:underline">
                    View all orders
                  </Link>
                }
              />
              {profile.recentOrders.length === 0 ? (
                <EmptyState
                  icon="receipt_long"
                  title="No orders yet"
                  description="Orders placed for this account will appear here."
                  className="border-0"
                />
              ) : (
                <Table>
                  <caption className="sr-only">Ten most recent orders</caption>
                  <THead>
                    <TR>
                      <TH>Order</TH>
                      <TH>Date</TH>
                      <TH>Status</TH>
                      <TH align="right">Amount</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {profile.recentOrders.map((order) => (
                      <TR key={order.id}>
                        <TD className="font-bold text-ink">
                          <Link href={`/orders/${order.id}`} className="hover:underline">
                            {order.order_number || order.id.slice(0, 8)}
                          </Link>
                        </TD>
                        <TD>{formatDate(order.created_at)}</TD>
                        <TD>
                          <OrderStatusBadge status={order.status} />
                        </TD>
                        <TD align="right" className="font-bold tabular-nums text-ink">
                          {formatCurrency(order.total_amount)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Service tickets and escalations"
                action={
                  <Link href="/tickets" className="text-xs font-bold text-lime-700 hover:underline">
                    All tickets
                  </Link>
                }
              />
              <CardBody>
                {profile.tickets.length === 0 ? (
                  <p className="rounded-card border border-dashed border-line-strong px-4 py-6 text-center text-[11px] text-ink-subtle">
                    No service tickets for this account.
                  </p>
                ) : (
                  <ul className="space-y-3 text-xs">
                    {profile.tickets.map((ticket) => (
                      <li
                        key={ticket.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-surface-sunken px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-ink">
                              {ticket.ticket_number || ticket.id.slice(0, 8)}
                            </span>
                            <Badge tone="neutral">{humanize(ticket.type)}</Badge>
                            <PriorityBadge priority={ticket.priority} />
                          </div>
                          {ticket.description ? (
                            <p className="mt-1 line-clamp-2 text-[11px] text-ink-muted">
                              {ticket.description}
                            </p>
                          ) : null}
                        </div>
                        <TicketStatusBadge status={ticket.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
