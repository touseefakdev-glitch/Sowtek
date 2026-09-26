/**
 * Order pricing rules, shared by the order builder and the order APIs.
 *
 * The 15% rate was previously written inline in three API routes and again in
 * the create-order form. That let the summary the agent read while building an
 * order drift from the totals the server actually stored, with nothing to
 * catch it. One constant, one calculation, imported everywhere.
 */

/** ZATCA standard VAT rate. */
export const VAT_RATE = 0.15;

export interface OrderTotals {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

/** Rounds to 2dp, matching the numeric column precision on `orders`. */
function round2(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Derives the stored subtotal, VAT and total from raw line items. `quantity *
 * unitPrice` is summed per line before rounding, so a many-line order is not
 * off by a cent the way rounding each line first would be.
 */
export function calculateTotals(
  lines: Array<{ quantity: number; unit_price: number | null }>
): OrderTotals {
  const subtotal = round2(
    lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price ?? 0), 0)
  );
  const vatAmount = round2(subtotal * VAT_RATE);

  return { subtotal, vatAmount, totalAmount: round2(subtotal + vatAmount) };
}
