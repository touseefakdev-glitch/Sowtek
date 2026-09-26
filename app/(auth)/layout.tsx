import React from 'react';

/**
 * Layout for unauthenticated screens. Intentionally chrome-free so the login
 * screen owns the full viewport and never renders the app sidebar.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-canvas">{children}</div>;
}
