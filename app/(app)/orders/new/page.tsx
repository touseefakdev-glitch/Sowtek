'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getContacts } from '@/lib/api/contacts';
import { getProducts } from '@/lib/api/products';
import { createOrder } from '@/lib/api/orders';

interface RestaurantOption {
  id: string;
  name: string;
  name_ar: string | null;
  address: string | null;
  delivery_zone: string | null;
  credit_limit: number | null;
  payment_terms: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  stock_status: string;
  is_active: boolean;
}

interface DraftLine {
  key: string;
  product_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

function CreateOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRestaurantId = searchParams.get('restaurant_id');

  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [loadingReferences, setLoadingReferences] = useState(true);

  const [restaurantId, setRestaurantId] = useState(preselectedRestaurantId ?? '');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadReferences = useCallback(async () => {
    setReferenceError(null);
    try {
      const [contactRes, productRes] = await Promise.all([
        getContacts({ limit: 100 }),
        getProducts({ active_only: true, limit: 100 }),
      ]);
      setRestaurants((contactRes.data ?? []) as RestaurantOption[]);
      setProducts((productRes.data ?? []) as ProductOption[]);
    } catch (err) {
      setReferenceError(
        err instanceof Error
          ? err.message
          : 'Unable to load restaurants and products from the database.'
      );
    } finally {
      setLoadingReferences(false);
    }
  }, []);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((item) => item.id === restaurantId) ?? null,
    [restaurants, restaurantId]
  );

  useEffect(() => {
    if (selectedRestaurant?.address !== undefined) {
      setDeliveryAddress((current) => current || (selectedRestaurant.address ?? ''));
    }
  }, [selectedRestaurant]);

  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const addProduct = (product: ProductOption) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.product_id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product_id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [
        ...prev,
        {
          key: `${product.id}-${prev.length}`,
          product_id: product.id,
          name: product.name,
          unit: product.unit,
          quantity: 1,
          unit_price: Number(product.price),
        },
      ];
    });
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((line) => line.key !== key));
  };

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const vatAmount = Number((subtotal * 0.15).toFixed(2));
  const totalAmount = Number((subtotal + vatAmount).toFixed(2));

  const canSubmit = Boolean(restaurantId) && lines.length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await createOrder({
        restaurant_id: restaurantId,
        delivery_date: deliveryDate || null,
        delivery_address: deliveryAddress || null,
        payment_terms: selectedRestaurant?.payment_terms ?? null,
        notes: notes || null,
        items: lines.map((line) => ({
          product_id: line.product_id,
          name: line.name,
          unit: line.unit,
          quantity: line.quantity,
          unit_price: line.unit_price,
        })),
      });

      const created = response.data as { id: string } | null;
      if (created?.id) {
        router.push(`/orders/${created.id}`);
      } else {
        router.push('/orders');
      }
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'The order could not be created.'
      );
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Link href="/orders" className="hover:text-slate-900">
                Orders
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-900">New order</span>
            </div>
            <h1 className="text-xl font-bold text-[#142340]">Create wholesale order</h1>
          </div>
          <Link
            href="/orders"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {referenceError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                <span className="material-symbols-outlined text-[18px] text-red-500">error</span>
                <div>
                  <p className="font-semibold">Could not load reference data</p>
                  <p className="mt-0.5 text-red-600">{referenceError}</p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                <span className="material-symbols-outlined text-[18px] text-red-500">error</span>
                <div>
                  <p className="font-semibold">Order was rejected</p>
                  <p className="mt-0.5 text-red-600">{submitError}</p>
                </div>
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-[#142340]">Customer &amp; delivery</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Restaurant account
                  </label>
                  <select
                    required
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value)}
                    disabled={loadingReferences}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#142340] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {loadingReferences
                        ? 'Loading restaurants...'
                        : restaurants.length === 0
                        ? 'No restaurants available'
                        : 'Select a restaurant'}
                    </option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                        {restaurant.delivery_zone ? ` — ${restaurant.delivery_zone}` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedRestaurant && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Credit limit SAR {Number(selectedRestaurant.credit_limit ?? 0).toLocaleString()}
                      {selectedRestaurant.payment_terms
                        ? ` · ${selectedRestaurant.payment_terms}`
                        : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Delivery date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#142340] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Delivery address
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Kitchen gate and delivery window"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#142340] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#142340] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-[#142340]">Order lines</h2>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  </div>
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search catalogue"
                    className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-[#142340] focus:outline-none"
                  />
                </div>
              </div>

              {products.length === 0 && !loadingReferences && (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400">
                  No active products exist in the catalogue.
                </p>
              )}

              {products.length > 0 && (
                <div className="mb-5 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                  {visibleProducts.length === 0 ? (
                    <p className="p-4 text-center text-[11px] text-slate-400">
                      No products match that search.
                    </p>
                  ) : (
                    visibleProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left transition last:border-0 hover:bg-slate-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-slate-900">
                            {product.name}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400">
                            {product.sku} · {product.unit}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {Number(product.price).toFixed(2)}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${
                              product.stock_status === 'available'
                                ? 'bg-emerald-50 text-emerald-700'
                                : product.stock_status === 'low'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {product.stock_status.replace(/_/g, ' ')}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {lines.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-[11px] text-slate-400">
                  No lines added yet. Select products from the catalogue above.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 uppercase text-slate-400">
                        <th className="pb-2">Item</th>
                        <th className="pb-2">Unit</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Unit price</th>
                        <th className="pb-2 text-right">Total</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lines.map((line) => (
                        <tr key={line.key}>
                          <td className="py-2.5 pr-2 font-semibold text-slate-900">{line.name}</td>
                          <td className="py-2.5 pr-2 text-slate-500">{line.unit}</td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(line.key, {
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-right font-mono focus:border-[#142340] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={line.unit_price}
                              onChange={(e) =>
                                updateLine(line.key, {
                                  unit_price: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-right font-mono focus:border-[#142340] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2 text-right font-mono font-bold text-slate-900">
                            {(line.quantity * line.unit_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => removeLine(line.key)}
                              className="rounded-lg px-2 py-1 text-red-500 transition hover:bg-red-50"
                              aria-label={`Remove ${line.name}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div>
            <section className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Summary
              </h2>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lines</span>
                  <span className="font-semibold text-slate-800">{lines.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-mono font-semibold text-slate-800">
                    SAR {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">VAT (15%)</span>
                  <span className="font-mono font-semibold text-slate-800">
                    SAR {vatAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm">
                  <span className="font-bold text-[#142340]">Total</span>
                  <span className="font-mono font-bold text-[#70b928]">
                    SAR {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#142340] px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating order...
                  </>
                ) : (
                  <>
                    <span>Create order</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>

              <p className="mt-2.5 text-[10px] leading-relaxed text-slate-400">
                Orders are saved with status <code>pending_confirmation</code>. Totals are
                recalculated server-side, including ZATCA VAT.
              </p>
            </section>
          </div>
        </form>
      </main>
    </>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f4f6f9] font-sans">
          <p className="text-xs text-slate-400">Loading order builder...</p>
        </div>
      }
    >
      <CreateOrderContent />
    </Suspense>
  );
}
