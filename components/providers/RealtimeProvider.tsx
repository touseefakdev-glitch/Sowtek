'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  dismissToast: (id: string) => void;
  currentUserId: string | null;
  userRole: string | null;
  setCurrentUser: (userId: string | null, role: string | null) => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  toasts: [],
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
        dismissToast,
        currentUserId,
        userRole,
        setCurrentUser,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '380px',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#142340',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              borderLeft: '4px solid #70b928',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              fontFamily: 'Inter, system-ui, sans-serif',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                {toast.title}
              </strong>
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px',
                }}
              >
                &times;
              </button>
            </div>
            {toast.body && (
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                {toast.body}
              </p>
            )}
            {toast.link && (
              <a
                href={toast.link}
                style={{
                  fontSize: '11px',
                  color: '#70b928',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginTop: '4px',
                }}
              >
                View details &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  );
}
