'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  is_online?: boolean;
}

export function AppSidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.data) setProfile(json.data);
        }
      } catch (err) {
        console.error('Failed to load profile for sidebar', err);
      }
    }
    loadProfile();
  }, []);

  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    {
      label: 'Unified Inbox',
      href: '/inbox',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      label: 'Tickets',
      href: '/tickets',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      label: 'Orders & Sales',
      href: '/orders',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      label: 'Contacts & 360°',
      href: '/contacts',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      label: 'Products Catalog',
      href: '/products',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className="w-60 flex-shrink-0 bg-white border-r border-slate-200/90 flex flex-col justify-between z-30 h-screen sticky top-0"
      data-purpose="primary-navigation"
    >
      <div>
        {/* Logo section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link href="/inbox" className="flex items-center gap-2.5 no-underline">
            {/* Arabic calligraphic / geometric mark */}
            <div className="w-8 h-8 rounded-lg bg-[#142340] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm11 0h2v7h-2v-7zm4 0h2v7h-2v-7z" />
              </svg>
            </div>
            <div className="flex flex-col tracking-tight leading-none">
              <span className="text-lg font-black text-[#142340]">sowtek</span>
              <span className="text-[9px] font-bold text-[#70b928] uppercase tracking-widest mt-0.5">ORDERFLOW</span>
            </div>
          </Link>
          <div className="w-2 h-2 rounded-full bg-[#70b928] shadow-xs" title="Connected" />
        </div>

        {/* Navigation Menu Items */}
        <nav className="p-3.5 space-y-1.5 text-[13px] font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/inbox' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#eef8eb] text-[#2c771c] font-semibold border border-[#d6eed0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={isActive ? 'text-[#358a22]' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* + Actions / New Order Pill Button */}
          <div className="pt-2">
            <Link
              href="/orders/new"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#e8f2fc] hover:bg-[#dbeafc] text-[#2463eb] text-xs font-bold rounded-xl transition-all shadow-xs no-underline"
              id="btn-actions-menu"
            >
              <span className="text-base leading-none font-medium">+</span>
              <span>New Order</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Bottom Navigation & Agent Profile */}
      <div className="p-3.5 border-t border-slate-100 space-y-2">
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors no-underline"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <span>Notifications</span>
        </Link>

        {/* Logged in User Profile Card matching Stitch reference */}
        <div className="pt-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 ring-1 ring-slate-300 shrink-0">
                <div className="w-full h-full bg-[#142340] text-white flex items-center justify-center font-bold text-xs uppercase">
                  {profile?.full_name ? profile.full_name.substring(0, 2) : 'KO'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-900 leading-tight truncate">
                  {profile?.full_name || 'Kenneth Ofkeli'}
                </div>
                {/* Green Available pill */}
                <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-[9px] font-bold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Available</span>
                </div>
              </div>
            </div>
            <Link href="/login" className="text-slate-400 hover:text-slate-600 p-1" title="Sign out / Switch user">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
