/**
 * Primary navigation definition.
 *
 * Kept out of the sidebar component so it is a stable module-level constant
 * rather than JSX rebuilt on every render, and so any other surface (command
 * palette, mobile drawer, tests) can read the same source of truth.
 *
 * `icon` values are Material Symbols ligatures. One icon system app-wide.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Match nested routes as active, e.g. /orders also lights up /orders/42. */
  matchNested?: boolean;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Unified Inbox', href: '/inbox', icon: 'forum' },
  { label: 'Orders & Sales', href: '/orders', icon: 'trending_up', matchNested: true },
  { label: 'Dashboard', href: '/dashboard', icon: 'monitoring' },
  { label: 'Contacts & 360°', href: '/contacts', icon: 'contacts', matchNested: true },
  { label: 'Products Catalog', href: '/products', icon: 'inventory_2' },
  { label: 'Notifications', href: '/notifications', icon: 'notifications' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  return Boolean(item.matchNested) && pathname.startsWith(`${item.href}/`);
}
