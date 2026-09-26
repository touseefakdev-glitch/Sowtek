'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getContact } from '@/lib/api/contacts';

export default function Restaurant360Page() {
  const params = useParams();
  const contactId = params?.id as string;

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getContact(contactId);
        if (cancelled) return;
        setProfileData(res.data);
      } catch (err) {
        if (cancelled) return;
        setProfileData(null);
        setError(
          err instanceof Error ? err.message : 'Unable to load this restaurant profile.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f3f7] font-sans">
        <p className="text-xs text-slate-400">Loading profile...</p>
      </div>
    );
  }

  if (error || !profileData?.restaurant) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f3f7] font-sans">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
          <span className="material-symbols-outlined text-[28px] text-red-500">error</span>
          <h1 className="mt-2 text-sm font-bold text-slate-800">Profile unavailable</h1>
          <p className="mt-1 text-xs text-slate-500">{error || 'Restaurant not found.'}</p>
          <Link
            href="/contacts"
            className="mt-5 inline-block rounded-xl bg-[#142340] px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  const data = profileData;
  const rest = data.restaurant;

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/contacts" className="hover:text-slate-900">Restaurants</Link>
              <span>/</span>
              <span className="font-semibold text-slate-900">{rest.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#142340]">{rest.name}</h1>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold text-xs uppercase">
                {rest.delivery_zone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/inbox"
              className="px-4 py-2 bg-[#70b928] hover:bg-[#5a991f] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <span>💬</span>
              <span>WhatsApp Chat</span>
            </Link>
            <Link
              href={`/orders/new?restaurant_id=${rest.id}`}
              className="px-4 py-2 bg-[#142340] hover:bg-[#0b1c30] text-white font-semibold rounded-xl text-xs transition shadow-sm"
            >
              ➕ Create Order
            </Link>
          </div>
        </div>

        {/* 360 Dashboard Grid */}
        <div className="p-6 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Financials & Terms */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Credit & Spend Metrics
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <span className="text-slate-600">Credit Limit</span>
                  <span className="font-bold text-[#142340]">SAR {data.payment_summary.credit_limit.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <span className="text-slate-600">Available Credit</span>
                  <span className="font-bold text-[#70b928]">SAR {data.payment_summary.available_credit.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <span className="text-slate-600">Outstanding Balance</span>
                  <span className="font-bold text-amber-600">SAR {data.payment_summary.outstanding_balance.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <span className="text-slate-600">Lifetime Spend</span>
                  <span className="font-bold text-[#142340]">SAR {data.payment_summary.lifetime_spend.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Key Contacts */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Kitchen & Procurement Contacts
              </h3>
              <div className="space-y-3 text-xs">
                {(data.contacts ?? []).length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400">
                    No contacts recorded for this account.
                  </p>
                )}
                {(data.contacts ?? []).map((cnt: any) => (
                  <div key={cnt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cnt.full_name}</span>
                      {cnt.is_primary && (
                        <span className="px-2 py-0.5 bg-[#edf8e7] text-[#70b928] rounded text-[10px] font-bold">Primary</span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{cnt.role}</div>
                    <div className="text-slate-700 font-mono mt-1 text-[11px]">{cnt.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Order History & Tickets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#142340]">Order History</h3>
                <Link href="/orders" className="text-xs text-[#70b928] font-bold hover:underline">
                  View All Orders &rarr;
                </Link>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.recent_orders ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No orders recorded for this account.
                      </td>
                    </tr>
                  )}
                  {(data.recent_orders ?? []).map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-[#142340]">
                        <Link href={`/orders/${o.id}`} className="hover:underline">{o.order_number}</Link>
                      </td>
                      <td className="py-3 text-slate-500">{o.created_at}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] uppercase">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        SAR {Number(o.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Support Tickets */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#142340]">Service Tickets & Escalations</h3>
                <Link href="/tickets" className="text-xs text-[#70b928] font-bold hover:underline">
                  All Tickets &rarr;
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                {(data.tickets ?? []).length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400">
                    No service tickets for this account.
                  </p>
                )}
                {(data.tickets ?? []).map((t: any) => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#142340]">{t.ticket_number}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] uppercase font-semibold">
                          {t.type}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-1">{t.description}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-bold text-[10px] uppercase">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
