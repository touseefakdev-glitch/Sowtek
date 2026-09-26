import { apiClient } from './client';

export interface TicketFilters {
  status?: string;
  priority?: string;
  type?: string;
  agent?: string;
  restaurant_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTicketPayload {
  restaurant_id: string;
  order_id?: string | null;
  conversation_id?: string | null;
  assigned_agent?: string | null;
  type: 'missing_item' | 'wrong_item' | 'quality' | 'delivery' | 'payment' | 'other';
  status?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  description: string;
}

export async function getTickets(filters: TicketFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.type) params.set('type', filters.type);
  if (filters.agent) params.set('agent', filters.agent);
  if (filters.restaurant_id) params.set('restaurant_id', filters.restaurant_id);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const query = params.toString();
  return apiClient<any[]>(`/api/tickets${query ? `?${query}` : ''}`);
}

export async function getTicket(id: string) {
  return apiClient<any>(`/api/tickets/${id}`);
}

export async function createTicket(data: CreateTicketPayload) {
  return apiClient<any>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTicketStatus(id: string, status: string, resolution?: string | null) {
  return apiClient<any>(`/api/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, resolution }),
  });
}
