import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const addItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Item name is required'),
  unit: z.string().min(1, 'Unit is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
});

interface RouteParams {
  params: {
    id: string;
  };
}

async function recalculateOrderTotals(supabase: ReturnType<typeof createClient>, orderId: string) {
  const { data: items } = await supabase
    .from('order_items')
    .select('quantity, unit_price')
    .eq('order_id', orderId);

  const subtotal = (items || []).reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const vatAmount = Number((subtotal * 0.15).toFixed(2));
  const totalAmount = Number((subtotal + vatAmount).toFixed(2));

  await supabase
    .from('orders')
    .update({
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return { subtotal, vatAmount, totalAmount };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: orderId } = params;

    const { data: items, error } = await supabase
      .from('order_items')
      .select('*, product:products(sku, category, stock_status)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      return apiError(error.message, 400, error, 'ITEMS_QUERY_ERROR');
    }

    return apiSuccess(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: orderId } = params;
    const body = await request.json();
    const parsed = addItemSchema.parse(body);

    const { data: item, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: parsed.product_id || null,
        name: parsed.name,
        unit: parsed.unit,
        quantity: parsed.quantity,
        unit_price: parsed.unit_price,
      })
      .select()
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'ITEM_INSERT_FAILED');
    }

    // Recalculate totals
    const newTotals = await recalculateOrderTotals(supabase, orderId);

    return apiSuccess({ item, totals: newTotals }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
