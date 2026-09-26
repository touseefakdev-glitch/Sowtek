'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getOrders } from '@/lib/api/orders';

export default function SupervisorDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getOrders({ limit: 10 });
        if (res.data) setOrders(res.data);
      } catch (err) {
        console.error('Failed to load dashboard orders', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#142340]">Supervisor Operations Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time SLA monitoring, order flow, and agent workload</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">Live Realtime Stream</span>
          </div>
        </div>

        <div className="p-6 max-w-7xl w-full space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                Total Orders Today
              </span>
              <div className="text-2xl font-bold text-[#142340] mt-2">48</div>
              <span className="text-[11px] text-[#70b928] font-semibold mt-1 block">
                +14% vs yesterday
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                Active Picking / Warehouse
              </span>
              <div className="text-2xl font-bold text-blue-600 mt-2">12</div>
              <span className="text-[11px] text-slate-500 mt-1 block">3 warehouse batches active</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                Out for Delivery
              </span>
              <div className="text-2xl font-bold text-indigo-600 mt-2">8</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Across Zone A & B</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                SLA Breach Risk
              </span>
              <div className="text-2xl font-bold text-red-600 mt-2">2</div>
              <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                Action required &gt;15m
              </span>
            </div>
          </div>

          {/* SLA Attention Queue & Agent Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SLA Priority Queue */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#142340]">SLA Critical Order Monitor</h3>
                <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-full">
                  2 At Risk
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-900">ORD-8820</span>
                      <span className="text-red-700 font-semibold">Shawarma Classic - Al Nakheel</span>
                    </div>
                    <div className="text-red-600 text-[11px] mt-1">
                      Pending confirmation for 38 minutes &bull; SLA Breached
                    </div>
                  </div>
                  <Link
                    href="/inbox"
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                  >
                    Triage Now &rarr;
                  </Link>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-900">ORD-8822</span>
                      <span className="text-amber-800 font-semibold">Al Romansiah Kitchen 4</span>
                    </div>
                    <div className="text-amber-700 text-[11px] mt-1">
                      Picking in progress &bull; 8 minutes left before delivery window
                    </div>
                  </div>
                  <Link
                    href="/orders/ORD-8822"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            </div>

            {/* Agent Workload Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-[#142340] mb-4">Active Agent Workload</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Tariq Al-Mansoor</div>
                    <div className="text-[11px] text-slate-500">Zone A Lead</div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#edf8e7] text-[#70b928] font-bold rounded-lg">
                    6 Active
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Sara Khalid</div>
                    <div className="text-[11px] text-slate-500">Zone J Lead</div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#edf8e7] text-[#70b928] font-bold rounded-lg">
                    4 Active
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Omar Al-Ghamdi</div>
                    <div className="text-[11px] text-slate-500">Inventory Specialist</div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg">
                    3 Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
