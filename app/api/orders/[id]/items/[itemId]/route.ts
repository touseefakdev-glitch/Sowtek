import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';
import { calculateTotals } from '@/lib/domain/pricing';

interface RouteParams {
  params: {
    id: string;
    itemId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: orderId, itemId } = params;

    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', orderId);

    if (deleteError) {
      return apiError(deleteError.message, 400, deleteError, 'DELETE_ITEM_FAILED');
    }

    // Recalculate order totals
    const { data: remainingItems } = await supabase
      .from('order_items')
      .select('quantity, unit_price')
      .eq('order_id', orderId);

    const { subtotal, vatAmount, totalAmount } = calculateTotals(remainingItems || []);

    await supabase
      .from('orders')
      .update({
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return apiSuccess({
      message: 'Item removed',
      totals: { subtotal, vatAmount, totalAmount },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
