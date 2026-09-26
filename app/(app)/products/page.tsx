'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getProducts, toggleAvailability } from '@/lib/api/products';

interface ProductRow {
  id: string;
  name: string;
  name_ar: string | null;
  sku: string;
  category: string | null;
  unit: string;
  price: number;
  stock_status: 'available' | 'low' | 'out_of_stock';
  is_active: boolean;
  updated_at: string | null;
}

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low' | 'out_of_stock'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setError(null);
    try {
      const res = await getProducts({
        category: category !== 'all' ? category : undefined,
        search: search || undefined,
        limit: 100,
      });
      setProducts((res.data ?? []) as ProductRow[]);
    } catch (err) {
      setProducts([]);
      setError(err instanceof Error ? err.message : 'Unable to load the product catalog.');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => void loadProducts(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts, search]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const product of products) {
      if (product.category) unique.add(product.category);
    }
    return Array.from(unique).sort();
  }, [products]);

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.stock_status === statusFilter;
  });

  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.stock_status === 'available').length;
  const lowStockCount = products.filter((p) => p.stock_status === 'low').length;
  const outOfStockCount = products.filter((p) => p.stock_status === 'out_of_stock').length;

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

  const handleToggleProduct = async (id: string, currentStatus: ProductRow['stock_status']) => {
    const nextStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';
    setBusyId(id);
    setRowError(null);
    try {
      await toggleAvailability(id, nextStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock_status: nextStatus, is_active: nextStatus === 'available' } : p))
      );
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'The stock status could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const header = ['sku', 'name', 'name_ar', 'category', 'unit', 'price', 'stock_status', 'is_active'];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = filteredProducts.map((p) =>
      [p.sku, p.name, p.name_ar, p.category, p.unit, p.price, p.stock_status, p.is_active]
        .map(escape)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sowtek-products-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
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
            <div className="flex items-center gap-2 text-slate-500">
              <button className="w-9 h-9 rounded-lg hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
              <div className="w-9 h-9 rounded-lg hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              </div>
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
                    onClick={handleExportCsv}
                    disabled={filteredProducts.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                    <span>Export CSV</span>
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
                      {categories.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
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
              {error && (
                <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                  {error}
                </div>
              )}
              {rowError && (
                <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                  {rowError}
                </div>
              )}

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
                    <th className="py-3 px-4 font-semibold">Stock Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && products.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[11px] text-slate-400">
                        Loading catalog...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredProducts.length === 0 && !error && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[11px] leading-relaxed text-slate-400">
                        {products.length === 0
                          ? 'No products in the catalog yet. Products added to the database appear here.'
                          : 'No products match the selected filters.'}
                      </td>
                    </tr>
                  )}

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
                              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-900 truncate text-xs">{p.name}</span>
                              {p.name_ar && (
                                <span className="font-arabic text-[11px] text-slate-500 truncate">
                                  {p.name_ar}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                            {p.sku}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {p.category || '--'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{p.unit}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {Number(p.price).toFixed(2)}
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
                          <button
                            onClick={() => void handleToggleProduct(p.id, p.stock_status)}
                            disabled={busyId === p.id}
                            title={p.stock_status === 'available' ? 'Mark out of stock' : 'Mark available'}
                            className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors focus:outline-none disabled:opacity-50 ${
                              p.stock_status === 'available' ? 'bg-[#70b928]' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                                p.stock_status === 'available' ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            ></div>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Row */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>
                Showing <span className="font-bold text-slate-800">{filteredProducts.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> items
              </span>
              <span>Requesting up to 100 items per page</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
