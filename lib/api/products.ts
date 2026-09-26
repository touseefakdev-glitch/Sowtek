import { apiClient } from './client';

export interface ProductFilters {
  category?: string;
  stock_status?: 'available' | 'low' | 'out_of_stock';
  search?: string;
  active_only?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateProductPayload {
  name: string;
  name_ar?: string | null;
  sku: string;
  category?: string | null;
  unit: string;
  price: number;
  stock_status?: 'available' | 'low' | 'out_of_stock';
  is_active?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  name_ar?: string | null;
  sku?: string;
  category?: string | null;
  unit?: string;
  price?: number;
  stock_status?: 'available' | 'low' | 'out_of_stock';
  is_active?: boolean;
}

export async function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.stock_status) params.set('stock_status', filters.stock_status);
  if (filters.search) params.set('search', filters.search);
  if (filters.active_only !== undefined) params.set('active_only', filters.active_only.toString());
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const query = params.toString();
  return apiClient<any[]>(`/api/products${query ? `?${query}` : ''}`);
}

export async function createProduct(data: CreateProductPayload) {
  return apiClient<any>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: UpdateProductPayload) {
  return apiClient<any>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function toggleAvailability(id: string, stockStatus: 'available' | 'low' | 'out_of_stock') {
  return apiClient<any>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ stock_status: stockStatus }),
  });
}
