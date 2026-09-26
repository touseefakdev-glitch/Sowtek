import { apiClient } from './client';

export interface ContactFilters {
  search?: string;
  zone?: string;
  agent?: string;
  page?: number;
  limit?: number;
}

export interface CreateContactPayload {
  name: string;
  name_ar?: string | null;
  phone?: string | null;
  whatsapp_number: string;
  email?: string | null;
  address?: string | null;
  delivery_zone?: string | null;
  credit_limit?: number;
  payment_terms?: string | null;
  assigned_agent?: string | null;
  notes?: string | null;
}

export interface UpdateContactPayload {
  name?: string;
  name_ar?: string | null;
  phone?: string | null;
  whatsapp_number?: string;
  email?: string | null;
  address?: string | null;
  delivery_zone?: string | null;
  credit_limit?: number;
  payment_terms?: string | null;
  assigned_agent?: string | null;
  notes?: string | null;
}

export async function getContacts(filters: ContactFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.zone) params.set('zone', filters.zone);
  if (filters.agent) params.set('agent', filters.agent);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const query = params.toString();
  return apiClient<any[]>(`/api/contacts${query ? `?${query}` : ''}`);
}

export async function getContact(id: string) {
  return apiClient<any>(`/api/contacts/${id}`);
}

export async function createContact(data: CreateContactPayload) {
  return apiClient<any>('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContact(id: string, data: UpdateContactPayload) {
  return apiClient<any>(`/api/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
