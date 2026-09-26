'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getOrder, updateOrderStatus } from '@/lib/api/orders';

const STATUS_FLOW = [
  'draft',
  'pending_confirmation',
  'confirmed',
  'sent_to_warehouse',
  'picking',
  'packed',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'invoiced',
  'paid',
  'cancelled',
] as const;

const ACTIONABLE_STATUSES = [
  'pending_confirmation',
  'confirmed',
  'sent_to_warehouse',
  'picking',
  'packed',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'invoiced',
] as const;

interface OrderItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number | null;
}

interface OrderHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  changed_by_user: { full_name: string; role: string } | null;
}

interface Order {
  id: string;
  order_number: string | null;
  status: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  delivery_date: string | null;
  delivery_address: string | null;
  payment_terms: string | null;
  notes: string | null;
  sla_deadline: string | null;
  created_at: string;
  restaurant: Record<string, any> | null;
  agent: Record<string, any> | null;
  items: OrderItem[] | null;
  history: OrderHistoryEntry[] | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Not set';
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadOrder = useCallback(async () => {
    setError(null);
    try {
      const res = await getOrder(orderId);
      setOrder(res.data as Order | null);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Unable to load this order.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    setLoading(true);
    void loadOrder();
  }, [loadOrder]);

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    setActionError(null);
    try {
      await updateOrderStatus(orderId, status);
      await loadOrder();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'The status update was rejected by the API.'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f3f7] font-sans">
        <p className="text-xs text-slate-400">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f3f7] font-sans">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
          <span className="material-symbols-outlined text-[28px] text-red-500">error</span>
          <h1 className="mt-2 text-sm font-bold text-slate-800">Order unavailable</h1>
          <p className="mt-1 text-xs text-slate-500">{error || 'Order not found.'}</p>
          <Link
            href="/orders"
            className="mt-5 inline-block rounded-xl bg-[#142340] px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const rest = order.restaurant;
  const currentIndex = STATUS_FLOW.indexOf(order.status as (typeof STATUS_FLOW)[number]);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Link href="/orders" className="hover:text-slate-900">
                Orders
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-900">
                {order.order_number || order.id}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#142340]">
                {order.order_number || order.id}
              </h1>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase text-blue-700">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Placed {formatDateTime(order.created_at)}
              {order.agent ? ` · Assigned to ${order.agent.full_name}` : ' · Unassigned'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-[#142340]">
                SAR {Number(order.total_amount).toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500">
                {order.payment_terms || 'No payment terms set'}
              </p>
            </div>
            <Link
              href="/orders"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              All orders
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Status control */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Fulfilment status
              </h2>
              <p className="mb-4 text-[11px] text-slate-400">
                Every change is written to <code>order_status_history</code> and the customer is
                notified on WhatsApp when the status becomes <code>delivered</code>.
              </p>

              {actionError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                  {actionError}
                </div>
              )}

              <div className="mb-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#70b928] transition-all"
                    style={{
                      width: `${
                        currentIndex < 0
                          ? 0
                          : ((currentIndex + 1) / STATUS_FLOW.length) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                  Step {currentIndex < 0 ? 0 : currentIndex + 1} of {STATUS_FLOW.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {ACTIONABLE_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updating || order.status === status}
                    onClick={() => void handleStatusChange(status)}
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                      order.status === status
                        ? 'bg-[#142340] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
                    }`}
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </section>

            {/* Line items */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-[#142340]">Line items</h2>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 uppercase text-slate-400">
                    <th className="pb-3">Item</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Unit price</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No line items recorded on this order.
                      </td>
                    </tr>
                  )}
                  {(order.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 text-slate-500">{item.unit}</td>
                      <td className="py-3 text-right font-mono">{item.quantity}</td>
                      <td className="py-3 text-right font-mono">
                        {Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {Number(item.total_price ?? item.quantity * item.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-100">
                    <td colSpan={4} className="pt-3 text-right text-slate-500">
                      Subtotal
                    </td>
                    <td className="pt-3 text-right font-mono">
                      {Number(order.subtotal).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="pt-1 text-right text-slate-500">
                      VAT
                    </td>
                    <td className="pt-1 text-right font-mono">
                      {Number(order.vat_amount).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="pt-2 text-right font-bold text-[#142340]">
                      Total
                    </td>
                    <td className="pt-2 text-right font-mono font-bold text-[#142340]">
                      {Number(order.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* History */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-[#142340]">Status history</h2>
              {(order.history ?? []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400">
                  No status changes have been recorded yet.
                </p>
              ) : (
                <ol className="space-y-3">
                  {(order.history ?? []).map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#70b928]" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {entry.from_status ? `${entry.from_status} → ` : ''}
                          {entry.to_status.replace(/_/g, ' ')}
                        </p>
                        {entry.note && (
                          <p className="mt-0.5 text-[11px] text-slate-500">{entry.note}</p>
                        )}
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {formatDateTime(entry.created_at)}
                          {entry.changed_by_user ? ` · ${entry.changed_by_user.full_name}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer
              </h2>
              {rest ? (
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-[#142340]">{rest.name}</p>
                  {rest.name_ar && (
                    <p className="font-arabic text-[11px] text-slate-400">{rest.name_ar}</p>
                  )}
                  {rest.whatsapp_number && (
                    <p className="font-mono text-[11px] text-slate-600">
                      {rest.whatsapp_number}
                    </p>
                  )}
                  {rest.email && <p className="text-[11px] text-slate-500">{rest.email}</p>}
                  {rest.address && <p className="text-[11px] text-slate-500">{rest.address}</p>}
                  {rest.delivery_zone && (
                    <p className="text-[11px] text-slate-500">Zone: {rest.delivery_zone}</p>
                  )}
                  <Link
                    href={`/contacts/${rest.id}`}
                    className="mt-3 inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    View 360° profile
                  </Link>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  No restaurant is linked to this order.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Delivery
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery date</span>
                  <span className="font-semibold text-slate-800">
                    {order.delivery_date || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SLA deadline</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(order.sla_deadline)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address</span>
                  <span className="max-w-[60%] text-right font-semibold text-slate-800">
                    {order.delivery_address || 'Not set'}
                  </span>
                </div>
              </div>
            </section>

            {order.notes && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </h2>
                <p className="whitespace-pre-wrap text-xs text-slate-600">{order.notes}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
