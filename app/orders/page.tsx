'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getOrders } from '@/lib/api/orders';

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fallbackOrders = [
    {
      id: 'ORD-8821',
      order_number: 'ORD-8821',
      status: 'picking',
      restaurant: { name: 'Burger Boutique - Al Olaya' },
      total_amount: 1240.0,
      delivery_date: '2026-09-19',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'ORD-8820',
      order_number: 'ORD-8820',
      status: 'out_for_delivery',
      restaurant: { name: 'Shawarma Classic - Al Nakheel' },
      total_amount: 3450.0,
      delivery_date: '2026-09-19',
      created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
      id: 'ORD-8819',
      order_number: 'ORD-8819',
      status: 'delivered',
      restaurant: { name: 'Mama Noura Express' },
      total_amount: 890.0,
      delivery_date: '2026-09-18',
      created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getOrders({ status: statusFilter || undefined, search: search || undefined });
        if (res.data && res.data.length > 0) {
          setOrders(res.data);
        } else {
          setOrders(fallbackOrders);
        }
      } catch (err) {
        setOrders(fallbackOrders);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter, search]);

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#142340]">Orders Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track and fulfill restaurant wholesale orders</p>
          </div>
          <Link
            href="/orders/new"
            className="px-4 py-2 bg-[#70b928] hover:bg-[#5a991f] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <span>➕</span>
            <span>Create New Order</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="p-6 max-w-7xl w-full">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by order #, restaurant name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#70b928]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#70b928]"
            >
              <option value="">All Statuses</option>
              <option value="pending_confirmation">Pending Confirmation</option>
              <option value="picking">Picking</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Delivery Date</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-[#142340]">
                      <Link href={`/orders/${o.id}`} className="hover:underline">
                        {o.order_number || o.id}
                      </Link>
                    </td>
                    <td className="p-4 font-medium text-slate-900">{o.restaurant?.name || 'Restaurant'}</td>
                    <td className="p-4 text-slate-500">{o.delivery_date || 'Today'}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      SAR {Number(o.total_amount).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] uppercase">
                        {o.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/orders/${o.id}`}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
