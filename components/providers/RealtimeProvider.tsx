'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  subscribeToConversations,
  subscribeToNotifications,
  subscribeToOrders,
  type UnsubscribeFn,
} from '@/lib/realtime/subscriptions';

export interface ToastNotification {
  id: string;
  title: string;
  body?: string;
  type?: string;
  link?: string;
}

interface RealtimeContextValue {
  toasts: ToastNotification[];
  /**
   * Raises a toast. Exposed because this is the app's only polite live region,
   * so any mutation that would otherwise complete silently needs to route its
   * confirmation through here to be announced to a screen reader.
   */
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  dismissToast: (id: string) => void;
  currentUserId: string | null;
  userRole: string | null;
  setCurrentUser: (userId: string | null, role: string | null) => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  toasts: [],
  addToast: () => {},
  dismissToast: () => {},
  currentUserId: null,
  userRole: null,
  setCurrentUser: () => {},
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 toasts

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setCurrentUser = useCallback((userId: string | null, role: string | null) => {
    setCurrentUserId(userId);
    setUserRole(role);
  }, []);

  useEffect(() => {
    // Attempt to fetch current user profile on mount if not set
    async function fetchAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setCurrentUserId(json.data.id);
            setUserRole(json.data.role);
          }
        }
      } catch (err) {
        console.error('Failed to fetch auth session for realtime subscriptions', err);
      }
    }

    fetchAuth();
  }, []);

  useEffect(() => {
    const unsubscribers: UnsubscribeFn[] = [];

    if (currentUserId) {
      // 1. Subscribe to notifications for this user
      const unsubNotifications = subscribeToNotifications(currentUserId, (notification) => {
        addToast({
          title: notification.title || 'New Notification',
          body: notification.body,
          type: notification.type,
          link: notification.link,
        });
      });
      unsubscribers.push(unsubNotifications);

      // 2. Subscribe to assigned conversations
      const unsubConversations = subscribeToConversations(currentUserId, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new?.last_message) {
          addToast({
            title: `New Message (${payload.new.whatsapp_number})`,
            body: payload.new.last_message,
            type: 'message',
            link: `/inbox`,
          });
        }
      });
      unsubscribers.push(unsubConversations);
    }

    // 3. If supervisor or admin, subscribe to global order flow updates
    if (userRole === 'supervisor' || userRole === 'admin') {
      const unsubOrders = subscribeToOrders((payload) => {
        if (payload.eventType === 'INSERT') {
          addToast({
            title: `New Order Received: ${payload.new?.order_number || ''}`,
            body: `Order total: SAR ${payload.new?.total_amount || '0'}`,
            type: 'order_created',
            link: `/orders/${payload.new?.id}`,
          });
        }
      });
      unsubscribers.push(unsubOrders);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [currentUserId, userRole, addToast]);

  return (
    <RealtimeContext.Provider
      value={{
        toasts,
        addToast,
        dismissToast,
        currentUserId,
        userRole,
        setCurrentUser,
      }}
    >
      {children}

      {/* Realtime toasts. Announced politely so a screen reader hears new
          orders without being interrupted mid-sentence. */}
      <div
        role="status"
        aria-live="polite"
        aria-relevant="additions text"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex flex-col gap-1 rounded-card border-l-4 border-l-lime bg-ink p-4 text-ink-inverse shadow-card-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <strong className="text-sm font-semibold">{toast.title}</strong>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label={`Dismiss notification: ${toast.title}`}
                className="-mr-1 -mt-1 rounded-control p-1 text-ink-inverse-muted transition hover:text-ink-inverse"
              >
                <span aria-hidden className="material-symbols-outlined text-[16px]">
                  close
                </span>
              </button>
            </div>

            {toast.body ? <p className="m-0 text-xs leading-relaxed text-ink-muted">{toast.body}</p> : null}

            {toast.link ? (
              <Link
                href={toast.link}
                className="mt-1 text-[11px] font-semibold text-lime hover:underline"
              >
                View details
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  );
}
