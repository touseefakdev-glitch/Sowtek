'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { createOrder, type OrderItemPayload } from '@/lib/api/orders';

function CreateOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledRestaurant = searchParams.get('restaurant') || 'Al Noor Restaurant';

  const [restaurantName, setRestaurantName] = useState(prefilledRestaurant);
  const [activeTab, setActiveTab] = useState<'items' | 'logistics' | 'billing'>('items');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      sku: string;
      unit: string;
      stock: string;
      quantity: number;
      unit_price: number;
    }>
  >([
    {
      id: 'i1',
      name: 'Premium Basmati Rice (20kg Bag)',
      sku: 'RIC-BAS-20KG',
      unit: '20kg Bag',
      stock: '280 In Stock',
      quantity: 10,
      unit_price: 185.0,
    },
    {
      id: 'i2',
      name: 'Roma Tomatoes (Grade A Crates)',
      sku: 'VEG-TOM-ROMA',
      unit: '15kg Crate',
      stock: '145 In Stock',
      quantity: 15,
      unit_price: 64.0,
    },
    {
      id: 'i3',
      name: 'Greek Extra Virgin Olive Oil (5L Tin)',
      sku: 'OIL-EV-5L',
      unit: '5L Tin',
      stock: '92 In Stock',
      quantity: 5,
      unit_price: 175.0,
    },
    {
      id: 'i4',
      name: 'French Truffle Butter (500g Tub)',
      sku: 'DAI-BUT-TRUF',
      unit: '500g Tub',
      stock: '48 In Stock',
      quantity: 8,
      unit_price: 142.0,
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addCustomItem = () => {
    const newItem = {
      id: `i_${Date.now()}`,
      name: 'Fresh Mozzarella Cheese (1kg Loaf)',
      sku: 'DAI-MOZ-1KG',
      unit: '1kg Pack',
      stock: '120 In Stock',
      quantity: 5,
      unit_price: 38.0,
    };
    setItems((prev) => [...prev, newItem]);
    showToast('Added Fresh Mozzarella Cheese to order list');
  };

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
  const vatAmount = Number((subtotal * 0.15).toFixed(2));
  const totalAmount = Number((subtotal + vatAmount).toFixed(2));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    showToast('Dispatching order to WMS picking system...');

    setTimeout(() => {
      router.push('/inbox/order/ORD-8821');
    }, 1200);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-800 antialiased bg-[#f4f6f9]">
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f4f6f9]">
        {/* Top Context Bar */}
        <header className="h-14 bg-white px-6 py-2.5 flex items-center justify-between border-b border-slate-200/80 z-10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900 font-headline">
                Create / Edit Order
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                Live Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">timer</span>
              <span className="text-slate-500">Order SLA Target:</span>
              <span className="font-bold font-mono text-slate-800">00:14:32</span>
            </div>
            <button
              type="button"
              onClick={() => showToast('Draft autosaved to cloud database')}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">cloud_done</span>
              <span>Synced</span>
            </button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-12 gap-6">
          {/* Column 1: Source WhatsApp Context & Queue Panel */}
          <aside className="col-span-12 xl:col-span-4 flex flex-col space-y-5">
            {/* WhatsApp Source Card */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">chat</span>
                  <span>Source Thread</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold">
                  #ORD-8821
                </span>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                  AN
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-slate-900 truncate leading-tight">
                    {restaurantName}
                  </h2>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">Chef Faisal Al-Qaisi</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">+966 54 321 8890</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              </div>

              {/* Parsed message excerpt */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">verified</span> Parsed via
                    WhatsApp
                  </span>
                  <span>10:14 AM</span>
                </div>
                <p className="text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-2xs">
                  "Salam brother Kenneth, please re-up 10 bags of 20kg Basmati, 15 cases tomatoes, 5
                  tins olive oil and 8 tubs truffle butter for tomorrow morning early dispatch bay 3.
                  Reference PO-NOOR-2024-8822."
                </p>
              </div>

              <Link
                href="/inbox"
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition no-underline"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-500">forum</span>
                <span>Open Split WhatsApp Feed</span>
              </Link>
            </div>

            {/* Active Drafts Queue Card */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Drafts Queue
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  3 Pending
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {/* Active Draft Item 1 */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Al Noor Restaurant</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Drafting
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    PO-NOOR-2024-8822 • {items.length} Line SKUs
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black text-slate-900 font-mono">
                      SAR {totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      Current Editing
                    </span>
                  </div>
                </div>

                {/* Draft Item 2 */}
                <div
                  onClick={() => {
                    setRestaurantName('Marina Cafe & Bakery');
                    showToast('Switched to Marina Cafe draft order');
                  }}
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 transition cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Marina Cafe & Bakery</span>
                    <span className="text-[11px] text-slate-400">09:48 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-500">PO-MAR-9102 • Pastry Flour 50kg</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      SAR 2,140.00
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      Review
                    </span>
                  </div>
                </div>

                {/* Draft Item 3 */}
                <div
                  onClick={() => {
                    setRestaurantName('Sultan Grill Express');
                    showToast('Switched to Sultan Grill draft order');
                  }}
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 transition cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Sultan Grill Express</span>
                    <span className="text-[11px] text-slate-400">09:12 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-500">PO-SULT-4481 • Charcoal & Spices</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      SAR 8,920.00
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                      Credit Hold
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity Metric Bar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 mt-auto">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Daily Dispatch Capacity</span>
                  <span className="text-emerald-700 font-bold">78% Filled</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '78%' }} />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  18 of 23 Delivery Runs Dispatched
                </span>
              </div>
            </div>
          </aside>

          {/* Column 2: Order Builder Staged Panel */}
          <section className="col-span-12 xl:col-span-8 flex flex-col space-y-6">
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-6">
              {/* Header with Status & Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                      Create New Order
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      Draft In Progress
                    </span>
                    <span className="font-mono font-bold text-slate-500 text-xs">#ORD-8822</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">
                      verified
                    </span>
                    <span>
                      Parsed from WhatsApp conversation with{' '}
                      <strong className="text-slate-700 font-semibold">{restaurantName}</strong>
                    </span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px] mr-1 text-emerald-600">
                      link
                    </span>
                    <span>WhatsApp Linked</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push('/inbox')}
                    className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span>Cancel</span>
                  </button>
                </div>
              </div>

              {/* Order Workflow Navigation Toggles */}
              <div className="flex items-center space-x-3 p-1 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'items'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    shopping_cart
                  </span>
                  <span>1. Line SKUs & Catalog</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logistics')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition ${
                    activeTab === 'logistics'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>2. Delivery Logistics</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition ${
                    activeTab === 'billing'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>3. VIP Net-30 Billing</span>
                </button>
              </div>

              {/* Section 1: Restaurant Selector & Credit Dossier */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1 uppercase tracking-wider">
                    <span>Client Restaurant Entity</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Validated B2B Wholesale Account
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-7 relative">
                    <div className="flex items-center px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 mr-2">
                        store
                      </span>
                      <input
                        className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none"
                        type="text"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-5 flex items-center justify-between p-2 px-3 rounded-xl bg-white border border-slate-200/70 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Tier Privilege
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        VIP Net-30 Auto-Approved
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Account Manager
                      </span>
                      <span className="text-xs font-bold text-slate-800">Kenneth Ofkeli</span>
                    </div>
                  </div>
                </div>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 space-y-0.5">
                    <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-medium">
                      <span className="material-symbols-outlined text-[14px]">
                        account_balance_wallet
                      </span>
                      <span>Wholesale Credit Line</span>
                    </div>
                    <p className="text-xs font-bold font-mono text-slate-900">SAR 45,000.00</p>
                    <div className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700">
                      <span className="material-symbols-outlined text-[11px]">check_circle</span>
                      <span>SAR 28,400.00 Available</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 space-y-0.5">
                    <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-medium">
                      <span className="material-symbols-outlined text-[14px]">contacts</span>
                      <span>Executive Contact</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">Chef Faisal Al-Qaisi</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      +966 54 321 8890 (Direct WhatsApp)
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 space-y-0.5">
                    <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-medium">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>Fulfillment Speed</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">Priority Loading Bay 3</p>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      Standard 0% Incident Rate (90d)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Order Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Order Line Items & Inventory Allocation
                    </h2>
                    <p className="text-xs text-slate-500">
                      Allocating live stock from Sowtek Central Riyadh Hub (Warehouse Bay 4)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">
                      add_circle
                    </span>
                    <span>Add Custom SKU</span>
                  </button>
                </div>

                {/* SKU Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2.5 px-4">Product / Wholesale SKU</th>
                        <th className="py-2.5 px-3">Unit Spec</th>
                        <th className="py-2.5 px-3 text-center">Warehouse Stock</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-4 text-right">Total (SAR)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{it.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{it.sku}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{it.unit}</td>
                          <td className="py-3 px-3 text-center text-emerald-700 font-semibold text-[11px]">
                            {it.stock}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => updateQuantity(it.id, it.quantity - 1)}
                                className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-1 font-bold text-xs">{it.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(it.id, it.quantity + 1)}
                                className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            SAR {it.unit_price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            SAR {(it.quantity * it.unit_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(it.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-slate-100 gap-4">
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• Delivery Zone: Zone A Central Riyadh (Morning Run 06:00 - 10:00)</p>
                    <p>• Payment Terms: Standard Net-30 Invoiced via ZATCA E-Invoice</p>
                  </div>

                  <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal ({items.length} items)</span>
                      <span className="font-mono font-semibold">SAR {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ZATCA VAT (15%)</span>
                      <span className="font-mono font-semibold">SAR {vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Invoice</span>
                      <span className="font-mono text-emerald-700">
                        SAR {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => showToast('Order draft saved to queue')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                  >
                    Save as Draft
                  </button>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleSubmitOrder}
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-[#142340] hover:bg-slate-800 text-white text-xs font-bold transition shadow-md flex items-center space-x-2"
                    >
                      <span>{submitting ? 'Dispatching...' : 'Submit Order & Dispatch WMS'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
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

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading order builder...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}
      });

      if (res.data?.id) {
        router.push(`/orders/${res.data.id}`);
      } else {
        router.push('/orders');
      }
    } catch (err) {
      console.warn('Order submission fallback', err);
      router.push('/orders');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/orders" className="hover:text-slate-900">Orders</Link>
              <span>/</span>
              <span className="font-semibold text-slate-900">New Order</span>
            </div>
            <h1 className="text-xl font-bold text-[#142340]">Create Wholesale Order</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/inbox"
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="px-5 py-2 bg-[#70b928] hover:bg-[#5a991f] text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Generating Order...' : 'Confirm & Generate Order &rarr;'}
            </button>
          </div>
        </div>

        <div className="p-6 max-w-5xl w-full mx-auto space-y-6">
          {/* Customer & Terms */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 uppercase font-semibold mb-1">
                Select Restaurant Customer
              </label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#70b928]"
              >
                <option value="rest-1">Burger Boutique - Al Olaya (Zone A)</option>
                <option value="rest-2">Shawarma Classic - Al Nakheel (Zone B)</option>
                <option value="rest-3">Mama Noura Express - Jeddah (Zone J1)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 uppercase font-semibold mb-1">
                Target Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#70b928]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-500 uppercase font-semibold mb-1">
                Delivery Address & Gate Notes
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#70b928]"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#142340]">Order Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
              >
                ➕ Add SKU Line
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <input
                    type="text"
                    placeholder="Product Name / Description"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                  >
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="crate">crate</option>
                    <option value="sack">sack</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-28 p-2 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                  />
                  <div className="w-28 text-right font-mono font-bold text-slate-900">
                    SAR {(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1 text-sm font-bold"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-end text-xs space-y-1.5">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">SAR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600">
                <span>VAT (15%)</span>
                <span className="font-mono">SAR {vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-bold text-[#142340] pt-2 border-t border-slate-200">
                <span>Calculated Total</span>
                <span className="font-mono text-[#70b928]">SAR {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#f1f3f7]">
          <AppSidebar />
          <div className="flex-1 p-8 text-slate-500 text-sm">Loading order creator...</div>
        </div>
      }
    >
      <CreateOrderContent />
    </Suspense>
  );
}
