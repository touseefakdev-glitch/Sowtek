'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getOrder, updateOrderStatus } from '@/lib/api/orders';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = (params?.id as string) || 'ORD-8821';

  const [orderStatus, setOrderStatus] = useState<'PICKING' | 'DISPATCHED' | 'DELIVERED'>('PICKING');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = (newStatus: 'PICKING' | 'DISPATCHED' | 'DELIVERED') => {
    setOrderStatus(newStatus);
    showToast(`Order status updated to ${newStatus}. Synced with WhatsApp.`);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-800 antialiased bg-[#f4f6f9]">
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f4f6f9]">
        {/* Top Context Bar */}
        <header className="h-14 bg-white px-5 flex items-center justify-between border-b border-slate-200/80 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#142340]">Orders Hub</span>
              <span className="px-2 py-0.5 rounded-full bg-[#eef8eb] text-[#5da01f] text-[10px] font-extrabold uppercase tracking-wide">
                Live
              </span>
            </div>
            <span className="text-slate-300 font-light">/</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">#ORD-8821</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-extrabold border border-sky-200">
                {orderStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => showToast('Printing invoice #ORD-8821...')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print Invoice</span>
            </button>
            <Link
              href="/inbox"
              className="px-3.5 py-1.5 rounded-lg bg-[#142340] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition no-underline flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              <span>Back to Chat</span>
            </Link>
          </div>
        </header>

        {/* 2-Column Content Layout */}
        <div className="flex-1 flex overflow-hidden p-5 gap-5">
          {/* Main Order Details Card */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 overflow-y-auto space-y-6">
            {/* Header & Status Stepper */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-extrabold text-[#142340]">Order #ORD-8821</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eef8eb] text-[#2c771c] font-bold text-xs border border-[#d6eed0]">
                    WhatsApp Verified PO
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on Today at 17:28 • Assigned Agent: Kenneth Ofkeli
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-[#142340]">SAR 4,820.00</div>
                <div className="text-[11px] text-emerald-600 font-semibold">Payment Terms: Net 15</div>
              </div>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                <p className="text-xs font-bold text-emerald-800 mt-1">Confirmed</p>
                <p className="text-[10px] text-emerald-600">17:28</p>
              </div>

              <div
                className={`p-3 rounded-xl border text-center ${
                  orderStatus === 'PICKING' || orderStatus === 'DISPATCHED' || orderStatus === 'DELIVERED'
                    ? 'bg-sky-50 border-sky-200 text-sky-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-lg">inventory</span>
                <p className="text-xs font-bold mt-1">Picking (WMS)</p>
                <p className="text-[10px]">Bay 4 Active</p>
              </div>

              <div
                className={`p-3 rounded-xl border text-center ${
                  orderStatus === 'DISPATCHED' || orderStatus === 'DELIVERED'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-lg">local_shipping</span>
                <p className="text-xs font-bold mt-1">Dispatched</p>
                <p className="text-[10px]">Reefer Van #12</p>
              </div>

              <div
                className={`p-3 rounded-xl border text-center ${
                  orderStatus === 'DELIVERED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-lg">task_alt</span>
                <p className="text-xs font-bold mt-1">Delivered</p>
                <p className="text-[10px]">Gate 3 Kitchen</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-bold text-[#142340] mb-3">Order Line Items</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Product Description</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">Unit</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold text-slate-800">Fresh Roma Tomatoes (A-Grade)</td>
                      <td className="p-3 text-slate-500 font-mono">TOM-ROMA-50</td>
                      <td className="p-3 text-center">50kg Box</td>
                      <td className="p-3 text-right font-bold">15</td>
                      <td className="p-3 text-right">SAR 14.50</td>
                      <td className="p-3 text-right font-bold">SAR 2,175.00</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-800">Premium Iceberg Lettuce</td>
                      <td className="p-3 text-slate-500 font-mono">LET-ICE-BOX</td>
                      <td className="p-3 text-center">Box (12 heads)</td>
                      <td className="p-3 text-right font-bold">20</td>
                      <td className="p-3 text-right">SAR 24.00</td>
                      <td className="p-3 text-right font-bold">SAR 480.00</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-800">Red Onions Sacks (Imported)</td>
                      <td className="p-3 text-slate-500 font-mono">ONI-RED-25</td>
                      <td className="p-3 text-center">25kg Sack</td>
                      <td className="p-3 text-right font-bold">10</td>
                      <td className="p-3 text-right">SAR 36.50</td>
                      <td className="p-3 text-right font-bold">SAR 365.00</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-800">Extra Virgin Olive Oil (Greek)</td>
                      <td className="p-3 text-slate-500 font-mono">OIL-EV-5L</td>
                      <td className="p-3 text-center">5L Tin</td>
                      <td className="p-3 text-right font-bold">8</td>
                      <td className="p-3 text-right">SAR 175.00</td>
                      <td className="p-3 text-right font-bold">SAR 1,400.00</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-800">Fresh Whole Milk (Pasteurized)</td>
                      <td className="p-3 text-slate-500 font-mono">DAI-MILK-2L</td>
                      <td className="p-3 text-center">Crate (6x2L)</td>
                      <td className="p-3 text-right font-bold">10</td>
                      <td className="p-3 text-right">SAR 40.00</td>
                      <td className="p-3 text-right font-bold">SAR 400.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="p-3 text-right text-slate-600">Subtotal</td>
                      <td className="p-3 text-right">SAR 4,820.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => showToast('Dispute / return ticket opened for #ORD-8821')}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
              >
                Flag Issue / Return
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('DISPATCHED')}
                  className="px-4 py-2 rounded-xl bg-[#142340] hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                >
                  Mark as Dispatched 🚚
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('DELIVERED')}
                  className="px-4 py-2 rounded-xl bg-[#70b928] hover:bg-[#5a991f] text-white text-xs font-bold transition shadow-xs"
                >
                  Confirm Delivery ✓
                </button>
              </div>
            </div>
          </div>

          {/* Right Customer / Logistics Summary */}
          <div className="w-80 space-y-4">
            {/* Restaurant Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 text-xs space-y-3">
              <h3 className="font-bold text-sm text-[#142340]">Restaurant & Delivery</h3>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">Al Noor Restaurant (Bay 3)</div>
                <div className="text-slate-500 mt-1">King Fahd Rd, Al Olaya, Riyadh</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">Zone A • Delivery Slot: Tomorrow 10:30 AM</div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Person</span>
                  <span className="font-bold text-slate-800">Faisal Al-Qaisi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-bold text-slate-800">+966 50 123 4567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gate Notes</span>
                  <span className="font-bold text-slate-800">Kitchen Gate #3 (Rear Alley)</span>
                </div>
              </div>
            </div>

            {/* Warehouse Dispatch Status */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 text-xs space-y-3">
              <h3 className="font-bold text-sm text-[#142340]">Warehouse Dispatch</h3>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Warehouse Batch</span>
                  <span className="font-mono font-bold text-slate-800">#BATCH-441</span>
                </div>
                <div className="flex justify-between">
                  <span>Reefer Temp</span>
                  <span className="text-emerald-600 font-bold">2.4°C (Normal)</span>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Driver</span>
                  <span className="font-bold text-slate-800">Tariq Al-Mansoor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2.5 transition-all z-50 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
