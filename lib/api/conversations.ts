import { apiClient } from './client';
import type { ApiResponse } from './response';

export interface ConversationFilters {
  status?: 'active' | 'in_process' | 'completed' | 'archived';
  agent?: string;
  channel?: 'whatsapp' | 'email' | 'sms' | 'facebook' | 'instagram';
  search?: string;
  page?: number;
  limit?: number;
}

export interface SendMessagePayload {
  body: string;
  media_url?: string | null;
  media_type?: string | null;
}

export interface UpdateConversationPayload {
  status?: 'active' | 'in_process' | 'completed' | 'archived';
  assigned_agent?: string | null;
  unread_count?: number;
  sla_deadline?: string | null;
}

export async function getConversations(filters: ConversationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.agent) params.set('agent', filters.agent);
  if (filters.channel) params.set('channel', filters.channel);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const query = params.toString();
  const endpoint = `/api/conversations${query ? `?${query}` : ''}`;
  return apiClient<any[]>(endpoint);
}

export async function getConversation(id: string) {
  return apiClient<any>(`/api/conversations/${id}`);
}

export async function getMessages(id: string, page = 1, limit = 50) {
  return apiClient<any[]>(`/api/conversations/${id}/messages?page=${page}&limit=${limit}`);
}

export async function sendMessage(id: string, payload: SendMessagePayload) {
  return apiClient<any>(`/api/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateConversation(id: string, data: UpdateConversationPayload) {
  return apiClient<any>(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
