import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchDashboardData } from '@/lib/data/orders';
import {
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  OrderStatusBadge,
  PageBody,
  PageHeader,
  RefreshButton,
  StatCard,
} from '@/components/ui';
import { isTerminalOrderStatus, isWarehouseStatus } from '@/lib/domain/status';
import { formatCurrency, formatNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Dashboard' };

function slaState(deadline: string | null): { breached: boolean; label: string } {
  if (!deadline) return { breached: false, label: 'No SLA deadline set' };

  const remainingMinutes = Math.round((new Date(deadline).getTime() - Date.now()) / 60000);

  if (remainingMinutes < 0) {
    const overdue = Math.abs(remainingMinutes);
    return {
      breached: true,
      label:
        overdue < 60
          ? `SLA breached ${overdue}m ago`
          : `SLA breached ${Math.floor(overdue / 60)}h ago`,
    };
  }

  return {
    breached: false,
    label:
      remainingMinutes < 60
        ? `${remainingMinutes}m until SLA deadline`
        : `${Math.floor(remainingMinutes / 60)}h until SLA deadline`,
  };
}

/**
 * Server Component: every metric here is derived from data that is available
 * at request time, so there is no client state to hydrate and no client fetch
 * to wait for. Refreshing re-runs this component via router.refresh().
 */
export default async function SupervisorDashboardPage() {
  const data = await fetchDashboardData().catch(() => null);

  if (!data) {
    return (
      <>
        <PageHeader title="Supervisor Operations" description="Live order flow and agent workload" />
        <PageBody>
          <ErrorState message="Unable to load dashboard data." />
        </PageBody>
      </>
    );
  }

  const orders = data.orders;
  const open = orders.filter((order) => !isTerminalOrderStatus(order.status));
  const atRisk = open.filter((order) => slaState(order.sla_deadline).breached);
  const openValue = open.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);

  const slaQueue = open
    .filter((order) => order.sla_deadline)
    .sort((a, b) => new Date(a.sla_deadline as string).getTime() - new Date(b.sla_deadline as string).getTime())
    .slice(0, 6);

  const workload = new Map<string, { id: string; name: string; count: number }>();
  for (const order of open) {
    if (!order.agent) continue;
    const existing = workload.get(order.agent.id);
    if (existing) existing.count += 1;
    else workload.set(order.agent.id, { id: order.agent.id, name: order.agent.full_name, count: 1 });
  }
  const agentWorkload = [...workload.values()].sort((a, b) => b.count - a.count);
  const unassigned = open.filter((order) => !order.agent).length;

  return (
    <>
      <PageHeader
        title="Supervisor Operations"
        description="Order flow, SLA deadlines and agent workload"
        action={<RefreshButton />}
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Orders matched" value={formatNumber(data.total)} hint={`${open.length} currently open`} />
          <StatCard
            label="In warehouse"
            value={formatNumber(open.filter((order) => isWarehouseStatus(order.status)).length)}
            hint="Sent to warehouse through ready for delivery"
            tone="info"
          />
          <StatCard
            label="Out for delivery"
            value={formatNumber(open.filter((order) => order.status === 'out_for_delivery').length)}
            hint={`Open value ${formatCurrency(openValue)}`}
            tone="warning"
          />
          <StatCard
            label="SLA breach risk"
            value={formatNumber(atRisk.length)}
            hint="Past the recorded SLA deadline"
            tone={atRisk.length > 0 ? 'danger' : 'success'}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="SLA order monitor"
              action={
                <span
                  className={
                    atRisk.length > 0
                      ? 'rounded-pill bg-status-danger-bg px-2.5 py-0.5 text-xs font-bold text-status-danger'
                      : 'rounded-pill bg-surface-sunken px-2.5 py-0.5 text-xs font-bold text-ink-muted'
                  }
                >
                  {atRisk.length} breached
                </span>
              }
            />
            <CardBody>
              {slaQueue.length === 0 ? (
                <p className="rounded-card border border-dashed border-line-strong px-6 py-8 text-center text-xs leading-relaxed text-ink-subtle">
                  No open orders carry an SLA deadline.
                  <br />
                  Deadlines appear here once they are recorded on an order.
                </p>
              ) : (
                <ul className="space-y-3">
                  {slaQueue.map((order) => {
                    const sla = slaState(order.sla_deadline);
                    return (
                      <li
                        key={order.id}
                        className={
                          sla.breached
                            ? 'flex flex-wrap items-center justify-between gap-3 rounded-card border border-status-danger/30 bg-status-danger-bg px-4 py-3'
                            : 'flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface-sunken px-4 py-3'
                        }
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-ink">
                              {order.order_number || order.id.slice(0, 8)}
                            </span>
                            <span className="truncate font-semibold text-ink">
                              {order.restaurant?.name || 'Unlinked restaurant'}
                            </span>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <div
                            className={
                              sla.breached
                                ? 'mt-1 text-[11px] font-semibold text-status-danger'
                                : 'mt-1 text-[11px] text-ink-subtle'
                            }
                          >
                            {sla.label}
                          </div>
                        </div>
                        <Link
                          href={`/orders/${order.id}`}
                          className={
                            sla.breached
                              ? 'shrink-0 rounded-control bg-status-danger px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-900'
                              : 'shrink-0 rounded-control bg-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-900'
                          }
                        >
                          Inspect
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Open orders by agent" />
            <CardBody>
              {agentWorkload.length === 0 ? (
                <p className="rounded-card border border-dashed border-line-strong px-6 py-8 text-center text-xs leading-relaxed text-ink-subtle">
                  No open orders are assigned to an agent yet.
                </p>
              ) : (
                <ul className="space-y-3 text-xs">
                  {agentWorkload.map((agent) => (
                    <li
                      key={agent.id}
                      className="flex items-center justify-between gap-2 rounded-card border border-line bg-surface-sunken px-3 py-2.5"
                    >
                      <span className="min-w-0 truncate font-bold text-ink">{agent.name}</span>
                      <span className="ml-2 shrink-0 rounded-control bg-lime-tint px-2.5 py-1 font-bold text-lime-700">
                        {agent.count} open
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 border-t border-line pt-3 text-[11px] text-ink-subtle">
                {unassigned} open order{unassigned === 1 ? '' : 's'} without an assigned agent
              </p>
            </CardBody>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
