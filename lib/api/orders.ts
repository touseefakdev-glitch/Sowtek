import { apiClient } from './client';

export interface OrderItemPayload {
  product_id?: string | null;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderPayload {
  restaurant_id: string;
  conversation_id?: string | null;
  assigned_agent?: string | null;
  delivery_date?: string | null;
  delivery_address?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
  items: OrderItemPayload[];
  status?: string;
}

export interface OrderFilters {
  status?: string;
  agent?: string;
  restaurant_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getOrders(filters: OrderFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.agent) params.set('agent', filters.agent);
  if (filters.restaurant_id) params.set('restaurant_id', filters.restaurant_id);
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const query = params.toString();
  return apiClient<any[]>(`/api/orders${query ? `?${query}` : ''}`);
}

export async function getOrder(id: string) {
  return apiClient<any>(`/api/orders/${id}`);
}

export async function createOrder(data: CreateOrderPayload) {
  return apiClient<any>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrderStatus(id: string, status: string, note?: string) {
  return apiClient<any>(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
}

export async function addOrderItem(orderId: string, item: OrderItemPayload) {
  return apiClient<any>(`/api/orders/${orderId}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function removeOrderItem(orderId: string, itemId: string) {
  return apiClient<any>(`/api/orders/${orderId}/items/${itemId}`, {
    method: 'DELETE',
  });
}
