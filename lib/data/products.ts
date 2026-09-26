import { createClient } from '@/lib/supabase/server';
import type { StockStatus } from '@/lib/domain/status';

/**
 * Server-side data access for the product catalog.
 */

export interface ProductRow {
  id: string;
  name: string;
  name_ar: string | null;
  sku: string | null;
  category: string | null;
  unit: string | null;
  price: number | null;
  stock_status: StockStatus;
  is_active: boolean | null;
  updated_at: string | null;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  limit?: number;
}

export interface ProductCatalog {
  products: ProductRow[];
  categories: string[];
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductCatalog> {
  const supabase = createClient();

  let query = supabase
    .from('products')
    .select('id, name, name_ar, sku, category, unit, price, stock_status, is_active, updated_at');

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query
    .order('name', { ascending: true })
    .limit(Math.min(100, Math.max(1, filters.limit ?? 100)));

  if (error) throw new Error(error.message);

  const products = (data ?? []) as ProductRow[];

  // Categories come from a separate unfiltered read so the filter control
  // still offers every category after the user narrows to one of them.
  const { data: categoryRows } = await supabase.from('products').select('category');

  const categories = Array.from(
    new Set(
      (categoryRows ?? [])
        .map((row) => row.category as string | null)
        .filter((value): value is string => Boolean(value))
    )
  ).sort();

  return { products, categories };
}
