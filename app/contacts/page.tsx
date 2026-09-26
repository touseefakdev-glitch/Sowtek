'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getContacts } from '@/lib/api/contacts';

export default function ContactsDirectoryPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getContacts({ search: search || undefined });
        if (cancelled) return;
        setContacts(res.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setContacts([]);
        setError(err instanceof Error ? err.message : 'Unable to load contacts.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#142340]">Restaurant Accounts</h1>
            <p className="text-xs text-slate-500 mt-0.5">Customer profiles, WhatsApp endpoints, and credit lines</p>
          </div>
          <Link
            href="/inbox"
            className="px-4 py-2 bg-[#70b928] hover:bg-[#5a991f] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <span>💬</span>
            <span>Open WhatsApp Inbox</span>
          </Link>
        </div>

        <div className="p-6 max-w-7xl w-full">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by restaurant name, phone, WhatsApp number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#70b928]"
            />
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <span className="material-symbols-outlined text-[18px] text-red-500">error</span>
              <div>
                <p className="font-semibold">Could not load contacts</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {loading && contacts.length === 0 && (
            <p className="py-12 text-center text-xs text-slate-400">Loading contacts...</p>
          )}

          {!loading && !error && contacts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-sm font-bold text-slate-700">No restaurant accounts</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                {search
                  ? `No accounts match "${search}".`
                  : 'No restaurant accounts exist yet. They are created from the Supabase restaurants table.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#142340] text-[#70b928] font-bold flex items-center justify-center text-sm">
                      {c.name ? c.name.substring(0, 2).toUpperCase() : 'RT'}
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                      {c.delivery_zone || 'Zone not set'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#142340] mt-3">{c.name}</h3>
                  {c.name_ar && <div className="text-xs text-slate-400 font-arabic">{c.name_ar}</div>}

                  <div className="text-xs text-slate-500 mt-2 font-mono">{c.whatsapp_number}</div>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold">Active</span>
                      <span className="font-bold text-[#142340]">{c.open_orders_count || 0}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tickets</span>
                      <span className="font-bold text-slate-900">{c.open_tickets_count || 0}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold">Spend</span>
                      <span className="font-bold text-[#70b928]">SAR {(c.total_spend || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/contacts/${c.id}`}
                  className="mt-5 w-full py-2 bg-slate-100 hover:bg-[#142340] hover:text-white text-slate-700 font-semibold rounded-xl text-xs text-center transition"
                >
                  View 360° Profile &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
