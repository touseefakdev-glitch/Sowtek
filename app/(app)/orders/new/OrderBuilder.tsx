'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createOrder } from '@/lib/api/orders';
import type { ContactListItem } from '@/lib/data/contacts';
import type { ProductRow } from '@/lib/data/products';
import { calculateTotals, VAT_RATE } from '@/lib/domain/pricing';
import { stockStatusMeta, toneClasses } from '@/lib/domain/status';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils/cn';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Textarea,
} from '@/components/ui';

interface DraftLine {
  /** Monotonic, never reused: see nextKey. */
  key: number;
  product_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

const LINE_FIELD =
  'w-full rounded-control border border-line bg-surface px-2 py-1.5 text-right font-mono text-sm text-ink ' +
  'transition-colors hover:border-line-strong focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/35';

export function OrderBuilder({
  restaurants,
  products,
  preselectedRestaurantId,
  referenceError,
}: {
  restaurants: ContactListItem[];
  products: ProductRow[];
  preselectedRestaurantId: string | null;
  referenceError: string | null;
}) {
  const router = useRouter();

  const [restaurantId, setRestaurantId] = useState(preselectedRestaurantId ?? '');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * A monotonic counter rather than an index. The previous key was
   * `${product.id}-${lines.length}`, which collides: build lines [A, B], delete
   * A so B holds key "B-1", then re-add A and it also takes key "A-1"... and on
   * a list of two they are equal, so React reuses the wrong row and the
   * quantity and price inputs swap places mid-edit.
   */
  const nextKey = useRef(0);

  const selectedRestaurant = useMemo(
    () => restaurants.find((item) => item.id === restaurantId) ?? null,
    [restaurants, restaurantId]
  );

  // Prefill the delivery address from the chosen account, without stomping on
  // an address the agent has already typed.
  useEffect(() => {
    if (selectedRestaurant?.address) {
      setDeliveryAddress((current) => current || selectedRestaurant.address || '');
    }
  }, [selectedRestaurant]);

  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    const active = products.filter((product) => product.is_active !== false);
    if (!term) return active;
    return active.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        (product.sku ?? '').toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const addProduct = (product: ProductRow) => {
    // `order_items.unit` is NOT NULL and the API validates min(1), so a product
    // with no unit cannot be ordered at all. The catalogue button is disabled
    // for those rows and says why, rather than letting the agent add it and
    // meet an opaque "Unit is required" rejection at submit time.
    //
    // Captured as a const because the narrowing would not survive into the
    // setState callback for a mutable property.
    const unit = product.unit;
    if (!unit) return;

    setLines((prev) => {
      const existing = prev.find((line) => line.product_id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product_id === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...prev,
        {
          key: nextKey.current++,
          product_id: product.id,
          name: product.name,
          unit,
          quantity: 1,
          unit_price: Number(product.price ?? 0),
        },
      ];
    });
  };

  const updateLine = (key: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const removeLine = (key: number) => {
    setLines((prev) => prev.filter((line) => line.key !== key));
  };

  // Same calculation the API applies, so the summary never disagrees with the
  // stored totals.
  const { subtotal, vatAmount, totalAmount } = calculateTotals(lines);

  const canSubmit = Boolean(restaurantId) && lines.length > 0 && !submitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      router.push(created?.id ? `/orders/${created.id}` : '/orders');
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The order could not be created.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        {referenceError ? (
          <ErrorState title="Reference data incomplete" message={referenceError} />
        ) : null}
        {submitError ? <ErrorState title="Order was rejected" message={submitError} /> : null}

        <Card>
          <CardHeader title="Customer and delivery" />
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Select
                  id="restaurant"
                  label="Restaurant account"
                  required
                  value={restaurantId}
                  onChange={(event) => setRestaurantId(event.target.value)}
                  hint={
                    selectedRestaurant
                      ? `Credit limit ${formatCurrency(selectedRestaurant.credit_limit)}${
                          selectedRestaurant.payment_terms
                            ? ` · ${selectedRestaurant.payment_terms}`
                            : ''
                        }`
                      : undefined
                  }
                >
                  <option value="">
                    {restaurants.length === 0 ? 'No restaurants available' : 'Select a restaurant'}
                  </option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                      {restaurant.delivery_zone ? ` — ${restaurant.delivery_zone}` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                id="delivery-date"
                type="date"
                label="Delivery date"
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
              />

              <Input
                id="delivery-address"
                type="text"
                label="Delivery address"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Kitchen gate and delivery window"
              />

              <div className="md:col-span-2">
                <Textarea
                  id="notes"
                  label="Notes"
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Anything the warehouse should know"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Order lines"
            description={
              lines.length === 0
                ? 'Select products from the catalogue'
                : `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} added`
            }
            action={
              <Input
                id="product-search"
                type="search"
                icon="search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search catalogue"
                aria-label="Search catalogue"
                className="w-full sm:w-56"
              />
            }
          />
          <CardBody>
            {products.length === 0 ? (
              <EmptyState
                icon="inventory_2"
                title="No products in the catalogue"
                description="Add products before building a wholesale order."
                className="border-0 px-0 py-6"
              />
            ) : visibleProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">
                No products match “{productSearch}”.
              </p>
            ) : (
              <ul className="mb-5 max-h-56 divide-y divide-line overflow-y-auto rounded-control border border-line">
                {visibleProducts.map((product) => {
                  const { tone } = stockStatusMeta(product.stock_status);
                  const orderable = Boolean(product.unit);
                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => addProduct(product)}
                        disabled={!orderable}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {product.name}
                          </span>
                          <span className="block font-mono text-xs text-ink-subtle">
                            {orderable
                              ? `${product.sku} · ${product.unit}`
                              : `${product.sku} · no unit set, cannot be ordered`}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="font-mono text-sm font-bold text-ink">
                            {formatCurrency(product.price)}
                          </span>
                          <span
                            className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${toneClasses(tone)}`}
                          >
                            {stockStatusMeta(product.stock_status).label}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {lines.length === 0 ? (
              <EmptyState
                icon="add_shopping_cart"
                title="No lines added yet"
                description="Pick products from the catalogue above to build this order."
                className="border-0 px-0 py-6"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <caption className="sr-only">
                    Draft order lines with editable quantity, unit price and line total
                  </caption>
                  <thead>
                    <tr className="border-b border-line uppercase text-ink-subtle">
                      <th scope="col" className="pb-2">Item</th>
                      <th scope="col" className="pb-2">Unit</th>
                      <th scope="col" className="pb-2 text-right">Qty</th>
                      <th scope="col" className="pb-2 text-right">Unit price</th>
                      <th scope="col" className="pb-2 text-right">Total</th>
                      <th scope="col" className="pb-2">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {lines.map((line) => (
                      <tr key={line.key}>
                        <th scope="row" className="py-2.5 pr-2 font-semibold text-ink">
                          {line.name}
                        </th>
                        <td className="py-2.5 pr-2 text-ink-muted">{line.unit ?? '—'}</td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(line.key, {
                                quantity: Math.max(1, Number(event.target.value) || 1),
                              })
                            }
                            aria-label={`Quantity for ${line.name}`}
                            className={cn(LINE_FIELD, 'w-20')}
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.unit_price}
                            onChange={(event) =>
                              updateLine(line.key, {
                                unit_price: Math.max(0, Number(event.target.value) || 0),
                              })
                            }
                            aria-label={`Unit price for ${line.name}`}
                            className={cn(LINE_FIELD, 'w-28')}
                          />
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono font-bold text-ink">
                          {formatCurrency(line.quantity * line.unit_price)}
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            variant="ghost"
                            icon="close"
                            onClick={() => removeLine(line.key)}
                            aria-label={`Remove ${line.name}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader title="Summary" />
          <CardBody>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Lines</dt>
                <dd className="font-semibold text-ink">{lines.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-mono font-semibold text-ink">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">VAT ({Math.round(VAT_RATE * 100)}%)</dt>
                <dd className="font-mono font-semibold text-ink">{formatCurrency(vatAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2.5">
                <dt className="font-bold text-ink">Total</dt>
                <dd className="font-mono text-lg font-bold text-ink">{formatCurrency(totalAmount)}</dd>
              </div>
            </dl>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon="arrow_forward"
              loading={submitting}
              disabled={!canSubmit}
              className="mt-5 w-full"
            >
              {submitting ? 'Creating order' : 'Create order'}
            </Button>

            <p className="mt-2.5 text-xs leading-relaxed text-ink-subtle">
              Orders are saved with status <span className="font-mono">pending_confirmation</span>.
              Totals are recalculated server-side against the same VAT rule shown here.
            </p>
          </CardBody>
        </Card>
      </div>
    </form>
  );
}
