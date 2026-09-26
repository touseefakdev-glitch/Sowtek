import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  name_ar: z.string().optional().nullable(),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unit (e.g. kg, box, pack) is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  stock_status: z.enum(['available', 'low', 'out_of_stock']).default('available'),
  is_active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    const category = searchParams.get('category');
    const stockStatus = searchParams.get('stock_status');
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('active_only') !== 'false';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (stockStatus) {
      query = query.eq('stock_status', stockStatus);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    query = query.order('name', { ascending: true }).range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return apiError(error.message, 400, error, 'PRODUCTS_QUERY_ERROR');
    }

    return apiSuccess(products, {
      count: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const parsed = createProductSchema.parse(body);

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: parsed.name,
        name_ar: parsed.name_ar || null,
        sku: parsed.sku,
        category: parsed.category || null,
        unit: parsed.unit,
        price: parsed.price,
        stock_status: parsed.stock_status,
        is_active: parsed.is_active,
      })
      .select()
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'PRODUCT_CREATE_FAILED');
    }

    return apiSuccess(product, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
