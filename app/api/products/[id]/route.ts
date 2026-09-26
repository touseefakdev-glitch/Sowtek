import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  name_ar: z.string().optional().nullable(),
  sku: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  unit: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  stock_status: z.enum(['available', 'low', 'out_of_stock']).optional(),
  is_active: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return apiError('Product not found', 404, error, 'PRODUCT_NOT_FOUND');
    }

    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();
    const parsed = updateProductSchema.parse(body);

    const updatePayload: Record<string, unknown> = {
      ...parsed,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'PRODUCT_UPDATE_FAILED');
    }

    return apiSuccess(updatedProduct);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = params;

    // Soft delete: set is_active = false
    const { data: product, error } = await supabase
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'PRODUCT_DELETE_FAILED');
    }

    return apiSuccess({ message: 'Product deactivated successfully', product });
  } catch (error) {
    return handleApiError(error);
  }
}
