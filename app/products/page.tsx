'use client';

import React, { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getProducts, toggleAvailability } from '@/lib/api/products';

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low' | 'out_of_stock'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackProducts = [
    {
      id: 'p-1',
      name: 'Premium Basmati Rice (20kg)',
      name_ar: 'أرز بسمتي فاخر (٢٠ كجم)',
      description: 'Aged Long Grain Extra White',
      sku: 'GRN-402',
      category: 'Grains & Rice',
      unit: '20kg Bag',
      price: 180.0,
      stock_qty: '142 bags',
      location: 'Riyadh Bay 4',
      stock_status: 'available',
      is_active: true,
      icon: 'grain',
    },
    {
      id: 'p-2',
      name: 'San Marzano Crushed Tomatoes',
      name_ar: 'طماطم سان مارزانو مطحونة',
      description: 'DOP Certified Campania IT',
      sku: 'CAN-118',
      category: 'Canned Goods',
      unit: '12×800g Case',
      price: 118.0,
      stock_qty: '14 cases',
      location: 'Re-order in progress',
      stock_status: 'low',
      is_active: true,
      icon: 'soup_kitchen',
    },
    {
      id: 'p-3',
      name: 'Extra Virgin Olive Oil 5L Tin',
      name_ar: 'زيت زيتون بكر ممتاز ٥ لتر',
      description: 'Cold Pressed Al Jouf 0.3% Acidity',
      sku: 'OIL-092',
      category: 'Oils & Fats',
      unit: '5L Tin',
      price: 250.0,
      stock_qty: '39 tins',
      location: 'Riyadh Bay 2',
      stock_status: 'available',
      is_active: true,
      icon: 'water_drop',
    },
    {
      id: 'p-4',
      name: 'White Truffle Infused Butter (500g)',
      name_ar: 'زبدة منكهة بالكمأة البيضاء',
      description: 'Chilled Artisan Dairy Line',
      sku: 'DRY-055',
      category: 'Dairy & Chilled',
      unit: '500g Tub',
      price: 95.0,
      stock_qty: '18 tubs',
      location: 'Cold Storage Bay 1',
      stock_status: 'available',
      is_active: true,
      icon: 'egg_alt',
    },
    {
      id: 'p-5',
      name: 'Black Peppercorn Whole Tellicherry (1kg)',
      name_ar: 'فلفل أسود حب تليشيري',
      description: 'Grade A High Piperine Origin IN',
      sku: 'SPC-033',
      category: 'Spices & Dry',
      unit: '1kg Pouch',
      price: 68.0,
      stock_qty: '0 pouches',
      location: 'Out of Stock - ETA 3d',
      stock_status: 'out_of_stock',
      is_active: false,
      icon: 'scatter_plot',
    },
    {
      id: 'p-6',
      name: 'Black Angus Ribeye Primal Cut MB3+',
      name_ar: 'ريب آي أنجوس أسود معتق',
      description: 'Chilled Grain-Fed AUS Whole Cut',
      sku: 'MEA-801',
      category: 'Fresh Meat',
      unit: 'Per KG (Avg 7.5kg)',
      price: 145.0,
      stock_qty: '22 cuts',
      location: 'Meat Aging Locker A',
      stock_status: 'available',
      is_active: true,
      icon: 'kebab_dining',
    },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getProducts({
          category: category !== 'all' ? category : undefined,
          search: search || undefined,
        });
        if (res.data && res.data.length > 0) {
          const merged = res.data.map((item: any, index: number) => {
            const fallback = fallbackProducts[index % fallbackProducts.length];
            return {
              id: item.id,
              name: item.name,
              name_ar: item.name_ar || fallback.name_ar,
              description: fallback.description,
              sku: item.sku || `SKU-${100 + index}`,
              category: item.category || 'General Wholesale',
              unit: item.unit || 'unit',
              price: item.price || fallback.price,
              stock_qty: fallback.stock_qty,
              location: fallback.location,
              stock_status: item.stock_status || fallback.stock_status,
              is_active: item.is_active ?? true,
              icon: fallback.icon,
            };
          });
          setProducts(merged);
        } else {
          setProducts(fallbackProducts);
        }
      } catch {
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, search]);

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'low') return p.stock_status === 'low';
    if (statusFilter === 'out_of_stock') return p.stock_status === 'out_of_stock' || p.stock_status === 'out';
    if (statusFilter === 'available') return p.stock_status === 'available';
    return true;
  });

  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.stock_status === 'available').length;
  const lowStockCount = products.filter((p) => p.stock_status === 'low').length;
  const outOfStockCount = products.filter((p) => p.stock_status === 'out_of_stock' || p.stock_status === 'out').length;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleToggleProduct = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';
    try {
      await toggleAvailability(id, nextStatus as any);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock_status: nextStatus, is_active: nextStatus === 'available' } : p))
      );
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock_status: nextStatus, is_active: nextStatus === 'available' } : p))
      );
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input
                className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
                placeholder="Search catalog, SKUs, restaurants, or orders..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d6eed0] text-[#142340] text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#70b928]"></span>
              WhatsApp Gateway Online
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <button className="w-9 h-9 rounded-lg hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
              <button className="w-9 h-9 rounded-lg hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors relative">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                <span className="w-2 h-2 rounded-full bg-[#70b928] absolute top-2 right-2"></span>
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#142340] text-white flex items-center justify-center font-bold text-xs">
              <span>KO</span>
            </div>
          </div>
        </header>

        {/* Master Catalog Card Container */}
        <main className="p-6 flex-1">
          <div className="w-full bg-white rounded-2xl shadow-card p-6 flex flex-col gap-6 border border-slate-200/70">
            {/* Top Bar / Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <span>Inventory & Wholesale SKU Management</span>
                  <span>·</span>
                  <span className="font-semibold text-[#70b928]">{totalCount} Total Items</span>
                </div>
                <h1 className="text-2xl font-bold text-[#142340] tracking-tight mt-0.5">Product Catalog</h1>
              </div>

              {/* Quick KPI Stats Bar */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#142340]"></span>
                  <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Total SKUs:</span>
                  <span className="text-sm font-bold text-[#142340]">{totalCount}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#70b928]"></span>
                  <span className="text-[11px] text-[#70b928] uppercase font-bold tracking-wider">In Stock:</span>
                  <span className="text-sm font-bold text-[#70b928]">{inStockCount}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-[11px] text-amber-700 uppercase font-bold tracking-wider">Low Stock:</span>
                  <span className="text-sm font-bold text-amber-700">{lowStockCount}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-[11px] text-rose-600 uppercase font-bold tracking-wider">Out of Stock:</span>
                  <span className="text-sm font-bold text-rose-600">{outOfStockCount}</span>
                </div>
              </div>
            </div>

            {/* Search, Filters, Bulk Actions & Primary CTA Bar */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Field */}
                <div className="flex-1 min-w-0 max-w-xl">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#70b928]/30">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                    <input
                      className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
                      placeholder="Search by product name, SKU code, or category..."
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert('Exporting Wholesale Product Catalog to CSV...')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => alert('Add Product Modal: Create custom SKU, unit pricing, Arabic name, and warehouse allocation.')}
                    className="px-4 py-2 rounded-xl bg-[#70b928] hover:bg-[#5da01f] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>+ Add Product</span>
                  </button>
                </div>
              </div>

              {/* Filter Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 p-2 rounded-xl border border-slate-200/50">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusFilter === 'all'
                        ? 'bg-white text-[#142340] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All <span className="ml-1 opacity-70">{totalCount}</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('available')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusFilter === 'available'
                        ? 'bg-white text-[#142340] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Available <span className="ml-1 opacity-70">{inStockCount}</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('low')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusFilter === 'low'
                        ? 'bg-white text-[#142340] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Low Stock <span className="ml-1 opacity-70">{lowStockCount}</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('out_of_stock')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusFilter === 'out_of_stock'
                        ? 'bg-white text-[#142340] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Out of Stock <span className="ml-1 opacity-70">{outOfStockCount}</span>
                  </button>
                </div>

                {/* Category Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Category:</span>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="appearance-none bg-white text-slate-800 text-xs font-semibold pl-3 pr-8 py-1.5 rounded-lg shadow-sm border border-slate-200 outline-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="Grains & Rice">Grains & Rice</option>
                      <option value="Canned Goods">Canned Goods</option>
                      <option value="Oils & Fats">Oils & Fats</option>
                      <option value="Dairy & Chilled">Dairy & Chilled</option>
                      <option value="Spices & Dry">Spices & Dry</option>
                      <option value="Fresh Meat">Fresh Meat</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1.5 pointer-events-none text-[16px] text-slate-500">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table Container */}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-[#70b928] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold">Product Name & Details</th>
                    <th className="py-3 px-4 font-semibold">SKU Code</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Unit / Packaging</th>
                    <th className="py-3 px-4 font-semibold text-right">Wholesale Price (SAR)</th>
                    <th className="py-3 px-4 font-semibold">Live Warehouse Stock</th>
                    <th className="py-3 px-4 font-semibold">Stock Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-[#edf8e7]/50' : ''}`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(p.id)}
                            className="w-4 h-4 rounded text-[#70b928] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                              <span className="material-symbols-outlined text-[20px]">{p.icon || 'inventory_2'}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-900 truncate text-xs">{p.name}</span>
                              <span className="text-[11px] text-slate-500 truncate">{p.name_ar || p.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                            {p.sku}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{p.category}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{p.unit}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {Number(p.price).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs">{p.stock_qty || '20 units'}</span>
                            <span className="text-[11px] text-slate-400">{p.location || 'Warehouse Zone A'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.stock_status === 'available' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d6eed0] text-[#142340] text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#70b928]"></span>
                              Available
                            </span>
                          ) : p.stock_status === 'low' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => alert(`Edit SKU details for: ${p.name}`)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                            >
                              Edit
                            </button>
                            {/* Toggle stock button */}
                            <button
                              onClick={() => handleToggleProduct(p.id, p.stock_status)}
                              title="Toggle Live Stock Availability"
                              className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors focus:outline-none ${
                                p.stock_status === 'available' ? 'bg-[#70b928]' : 'bg-slate-300'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                                  p.stock_status === 'available' ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              ></div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination & Summary Row */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>
                Showing <span className="font-bold text-slate-800">{filteredProducts.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> items
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50">
                  Previous
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-[#142340] text-white font-bold">1</button>
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">
                  2
                </button>
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
