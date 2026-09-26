import { apiClient } from './client';

export async function getNotifications(unreadOnly = false, page = 1, limit = 30) {
  const params = new URLSearchParams();
  if (unreadOnly) params.set('unread_only', 'true');
  params.set('page', page.toString());
  params.set('limit', limit.toString());

  return apiClient<any[]>(`/api/notifications?${params.toString()}`);
}

export async function markAllRead() {
  return apiClient<{ message: string; updated_count: number }>('/api/notifications', {
    method: 'PATCH',
  });
}

export async function markRead(id: string) {
  return apiClient<any>(`/api/notifications/${id}`, {
    method: 'PATCH',
  });
}
