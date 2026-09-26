'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getOrders } from '@/lib/api/orders';

interface DashboardOrder {
  id: string;
  order_number: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  sla_deadline: string | null;
  restaurant: { id: string; name: string } | null;
  agent: { id: string; full_name: string } | null;
}

const CLOSED_STATUSES = ['delivered', 'invoiced', 'paid', 'cancelled'];
const WAREHOUSE_STATUSES = ['sent_to_warehouse', 'picking', 'packed', 'ready_for_delivery'];

function isSlaBreached(order: DashboardOrder): boolean {
  if (!order.sla_deadline || CLOSED_STATUSES.includes(order.status)) return false;
  return new Date(order.sla_deadline).getTime() < Date.now();
}

function slaLabel(order: DashboardOrder): string {
  if (!order.sla_deadline) return 'No SLA deadline set';
  const remainingMinutes = Math.round(
    (new Date(order.sla_deadline).getTime() - Date.now()) / 60000
  );
  if (remainingMinutes < 0) {
    const overdue = Math.abs(remainingMinutes);
    if (overdue < 60) return `SLA breached ${overdue}m ago`;
    return `SLA breached ${Math.floor(overdue / 60)}h ago`;
  }
  if (remainingMinutes < 60) return `${remainingMinutes}m until SLA deadline`;
  return `${Math.floor(remainingMinutes / 60)}h until SLA deadline`;
}

export default function SupervisorDashboardPage() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await getOrders({ limit: 100 });
      setOrders((res.data ?? []) as DashboardOrder[]);
      setTotalCount(res.meta?.count ?? null);
    } catch (err) {
      setOrders([]);
      setTotalCount(null);
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const metrics = useMemo(() => {
    const open = orders.filter((o) => !CLOSED_STATUSES.includes(o.status));
    return {
      total: totalCount ?? orders.length,
      open: open.length,
      warehouse: open.filter((o) => WAREHOUSE_STATUSES.includes(o.status)).length,
      outForDelivery: open.filter((o) => o.status === 'out_for_delivery').length,
      atRisk: open.filter(isSlaBreached).length,
      revenue: open.reduce((sum, o) => sum + Number(o.total_amount), 0),
    };
  }, [orders, totalCount]);

  const slaQueue = useMemo(
    () =>
      orders
        .filter((o) => !CLOSED_STATUSES.includes(o.status) && o.sla_deadline)
        .sort(
          (a, b) =>
            new Date(a.sla_deadline as string).getTime() - new Date(b.sla_deadline as string).getTime()
        )
        .slice(0, 6),
    [orders]
  );

  const agentWorkload = useMemo(() => {
    const buckets = new Map<string, { id: string; name: string; count: number }>();
    for (const order of orders) {
      if (CLOSED_STATUSES.includes(order.status)) continue;
      if (!order.agent) continue;
      const key = order.agent.id;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(key, { id: key, name: order.agent.full_name, count: 1 });
      }
    }
    return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  }, [orders]);

  const unassigned = useMemo(
    () => orders.filter((o) => !CLOSED_STATUSES.includes(o.status) && !o.agent).length,
    [orders]
  );

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#142340]">Supervisor Operations Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Order flow, SLA deadlines, and agent workload from live database records
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-6 max-w-7xl w-full space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                Orders Matched
              </span>
              <div className="text-2xl font-bold text-[#142340] mt-2">
                {loading ? '--' : metrics.total}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {metrics.open} currently open
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                In Warehouse
              </span>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                {loading ? '--' : metrics.warehouse}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Sent to warehouse through ready for delivery
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                Out for Delivery
              </span>
              <div className="text-2xl font-bold text-indigo-600 mt-2">
                {loading ? '--' : metrics.outForDelivery}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Open value SAR {metrics.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                SLA Breach Risk
              </span>
              <div className="text-2xl font-bold text-red-600 mt-2">
                {loading ? '--' : metrics.atRisk}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Past the recorded SLA deadline
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SLA Priority Queue */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#142340]">SLA Order Monitor</h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    metrics.atRisk > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {metrics.atRisk} Breached
                </span>
              </div>

              {loading && slaQueue.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Loading open orders...</p>
              ) : slaQueue.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs leading-relaxed text-slate-400">
                  No open orders carry an SLA deadline.
                  <br />
                  Deadlines appear here once they are recorded on an order.
                </p>
              ) : (
                <div className="space-y-3">
                  {slaQueue.map((order) => {
                    const breached = isSlaBreached(order);
                    return (
                      <div
                        key={order.id}
                        className={`p-4 border rounded-xl flex items-center justify-between gap-3 text-xs ${
                          breached
                            ? 'bg-red-50/60 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                breached ? 'text-red-900' : 'text-slate-900'
                              }`}
                            >
                              {order.order_number || order.id.slice(0, 8)}
                            </span>
                            <span className="text-slate-700 font-semibold truncate">
                              {order.restaurant?.name || 'Unlinked restaurant'}
                            </span>
                            <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div
                            className={`text-[11px] mt-1 ${
                              breached ? 'text-red-600' : 'text-slate-500'
                            }`}
                          >
                            {slaLabel(order)}
                          </div>
                        </div>
                        <Link
                          href={`/orders/${order.id}`}
                          className={`shrink-0 px-3 py-1.5 font-semibold rounded-lg transition text-white ${
                            breached ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          Inspect
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Agent Workload Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-[#142340] mb-4">Open Orders by Agent</h3>

              {loading && agentWorkload.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Loading workload...</p>
              ) : agentWorkload.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs leading-relaxed text-slate-400">
                  No open orders are assigned to an agent yet.
                </p>
              ) : (
                <div className="space-y-3 text-xs">
                  {agentWorkload.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="min-w-0 truncate font-bold text-slate-900">
                        {agent.name}
                      </div>
                      <span className="px-2.5 py-1 bg-[#edf8e7] text-[#70b928] font-bold rounded-lg shrink-0 ml-2">
                        {agent.count} Open
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                {unassigned} open order{unassigned === 1 ? '' : 's'} without an assigned agent
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
