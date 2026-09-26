/**
 * Single source of truth for every status domain in the product.
 *
 * Each status owns:
 *  - its human label (single wording everywhere in the UI)
 *  - a semantic tone that maps onto the `status-*` design tokens
 *  - lifecycle flags (terminal / warehouse-stage / actionable)
 *  - the set of statuses it may transition to
 *
 * Pages must import from here rather than declaring their own arrays. Two
 * pages disagreeing about what "closed" or "actionable" means is a
 * correctness bug, not a cosmetic one, so this module is the fix.
 */

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusMeta {
  label: string;
  tone: Tone;
  /** Short operator-facing hint shown under the label in detail views. */
  hint?: string;
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const ORDER_STATUSES = [
  'draft',
  'pending_confirmation',
  'confirmed',
  'sent_to_warehouse',
  'picking',
  'packed',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'invoiced',
  'paid',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'neutral', hint: 'Not yet sent to the customer.' },
  pending_confirmation: {
    label: 'Pending confirmation',
    tone: 'warning',
    hint: 'Waiting for the restaurant to confirm.',
  },
  confirmed: { label: 'Confirmed', tone: 'info', hint: 'Confirmed and queued for the warehouse.' },
  sent_to_warehouse: { label: 'Sent to warehouse', tone: 'info', hint: 'With the warehouse team.' },
  picking: { label: 'Picking', tone: 'info', hint: 'Items being picked from stock.' },
  packed: { label: 'Packed', tone: 'info', hint: 'Picked and packed, awaiting dispatch.' },
  ready_for_delivery: { label: 'Ready for delivery', tone: 'success', hint: 'Ready for the driver.' },
  out_for_delivery: { label: 'Out for delivery', tone: 'success', hint: 'With the delivery driver.' },
  delivered: { label: 'Delivered', tone: 'success', hint: 'Delivered to the restaurant.' },
  invoiced: { label: 'Invoiced', tone: 'success', hint: 'Invoice issued.' },
  paid: { label: 'Paid', tone: 'success', hint: 'Payment received.' },
  cancelled: { label: 'Cancelled', tone: 'danger', hint: 'Order was cancelled.' },
};

/** Statuses that end the order lifecycle; excluded from all open queues. */
export const ORDER_TERMINAL_STATUSES: readonly OrderStatus[] = [
  'delivered',
  'invoiced',
  'paid',
  'cancelled',
];

/** Statuses where the order is physically inside the warehouse pipeline. */
export const ORDER_WAREHOUSE_STATUSES: readonly OrderStatus[] = [
  'sent_to_warehouse',
  'picking',
  'packed',
  'ready_for_delivery',
];

/** Statuses an operator is expected to act on next. */
export const ORDER_ACTIONABLE_STATUSES: readonly OrderStatus[] = [
  'draft',
  'pending_confirmation',
  'confirmed',
  'sent_to_warehouse',
  'picking',
  'packed',
  'ready_for_delivery',
  'out_for_delivery',
];

/** Allowed forward transitions, keyed by current status. */
export const ORDER_STATUS_FLOW: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ['pending_confirmation', 'confirmed', 'cancelled'],
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['sent_to_warehouse', 'cancelled'],
  sent_to_warehouse: ['picking', 'cancelled'],
  picking: ['packed', 'cancelled'],
  packed: ['ready_for_delivery', 'cancelled'],
  ready_for_delivery: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['invoiced'],
  invoiced: ['paid'],
  paid: [],
  cancelled: [],
};

/* ------------------------------------------------------------------ */
/* Tickets                                                             */
/* ------------------------------------------------------------------ */

export const TICKET_STATUSES = [
  'new',
  'investigating',
  'waiting_for_information',
  'resolution_offered',
  'resolved',
  'escalated',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_META: Record<TicketStatus, StatusMeta> = {
  new: { label: 'New', tone: 'info' },
  investigating: { label: 'Investigating', tone: 'warning' },
  waiting_for_information: { label: 'Waiting for information', tone: 'warning' },
  resolution_offered: { label: 'Resolution offered', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  escalated: { label: 'Escalated', tone: 'danger' },
};

export const TICKET_TERMINAL_STATUSES: readonly TicketStatus[] = ['resolved'];

/**
 * Allowed ticket transitions, keyed by current status.
 *
 * The ticket console previously offered exactly two buttons, "resolved" and
 * "escalated", from every state. That made three of the six statuses
 * (investigating, waiting_for_information, resolution_offered) unreachable from
 * the UI even though the schema and API accept them, and let an agent resolve
 * an already-resolved ticket. Mirrors the order graph so both consoles behave
 * the same way.
 */
export const TICKET_STATUS_FLOW: Record<TicketStatus, readonly TicketStatus[]> = {
  new: ['investigating', 'escalated', 'resolved'],
  investigating: ['waiting_for_information', 'resolution_offered', 'escalated', 'resolved'],
  waiting_for_information: ['investigating', 'escalated', 'resolved'],
  resolution_offered: ['resolved', 'investigating', 'escalated'],
  escalated: ['investigating', 'resolved'],
  resolved: [],
};

export function isTicketStatus(value: string): value is TicketStatus {
  return (TICKET_STATUSES as readonly string[]).includes(value);
}

/** Statuses reachable from the current one, empty when terminal. */
export function ticketTransitions(from: string): readonly TicketStatus[] {
  if (!isTicketStatus(from)) return [];
  return TICKET_STATUS_FLOW[from];
}

/**
 * Ticket type and priority vocabularies are fixed by the CHECK constraints on
 * public.tickets in supabase/migrations/001_initial_schema.sql and mirrored in
 * the zod schemas in app/api/tickets. They must match those exactly:
 *
 *   type     IN ('missing_item','wrong_item','quality','delivery','payment','other')
 *   priority IN ('low','normal','high','urgent')
 *
 * These lists previously said `billing` and `medium`, neither of which the
 * database accepts, so every priority of "normal" fell through the lookup and
 * rendered as an unstyled grey chip instead of the intended info tone.
 */
export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_PRIORITY_META: Record<TicketPriority, StatusMeta> = {
  low: { label: 'Low', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'info' },
  high: { label: 'High', tone: 'warning' },
  urgent: { label: 'Urgent', tone: 'danger' },
};

export const TICKET_TYPES = [
  'missing_item',
  'wrong_item',
  'quality',
  'delivery',
  'payment',
  'other',
] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const TICKET_TYPE_META: Record<TicketType, StatusMeta> = {
  missing_item: { label: 'Missing item', tone: 'warning' },
  wrong_item: { label: 'Wrong item', tone: 'warning' },
  quality: { label: 'Quality', tone: 'warning' },
  delivery: { label: 'Delivery', tone: 'info' },
  payment: { label: 'Payment', tone: 'info' },
  other: { label: 'Other', tone: 'neutral' },
};

export function ticketTypeMeta(type: string): StatusMeta {
  return TICKET_TYPE_META[type as TicketType] ?? { label: type, tone: 'neutral' };
}

/** The statuses worth a queue tab. The rest are reachable from the detail. */
export const TICKET_QUEUE_STATUSES: readonly TicketStatus[] = [
  'new',
  'investigating',
  'escalated',
];

/* ------------------------------------------------------------------ */
/* Conversations & products (shared lifecycle)                        */
/* ------------------------------------------------------------------ */

export const CONVERSATION_STATUSES = ['active', 'in_process', 'completed', 'archived'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const LIFECYCLE_META: Record<ConversationStatus, StatusMeta> = {
  active: { label: 'Active', tone: 'success' },
  in_process: { label: 'In process', tone: 'warning' },
  completed: { label: 'Completed', tone: 'info' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const PRODUCT_STATUS_META: Record<ConversationStatus, StatusMeta> = {
  active: { label: 'Active', tone: 'success' },
  in_process: { label: 'In process', tone: 'warning' },
  completed: { label: 'Completed', tone: 'info' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const STOCK_STATUSES = ['available', 'low', 'out_of_stock'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const STOCK_STATUS_META: Record<StockStatus, StatusMeta> = {
  available: { label: 'In stock', tone: 'success' },
  low: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-status-neutral-bg text-status-neutral',
  info: 'bg-status-info-bg text-status-info',
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  danger: 'bg-status-danger-bg text-status-danger',
};

const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-status-neutral',
  info: 'bg-status-info',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
};

/** Chip classes for a tone. Used by the Badge primitive. */
export function toneClasses(tone: Tone): string {
  return TONE_CLASS[tone];
}

/** Small solid dot colour for a tone, for dense table rows. */
export function toneDot(tone: Tone): string {
  return TONE_DOT[tone];
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isTerminalOrderStatus(status: string): boolean {
  return (ORDER_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function isWarehouseStatus(status: string): boolean {
  return (ORDER_WAREHOUSE_STATUSES as readonly string[]).includes(status);
}

export function isTerminalTicketStatus(status: string): boolean {
  return (TICKET_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function isActionableOrderStatus(status: string): boolean {
  return (ORDER_ACTIONABLE_STATUSES as readonly string[]).includes(status);
}

export function canTransitionOrder(from: string, to: string): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  return ORDER_STATUS_FLOW[from].includes(to);
}

/** Label lookup that tolerates unknown/legacy values from the database. */
export function orderStatusMeta(status: string): StatusMeta {
  return isOrderStatus(status) ? ORDER_STATUS_META[status] : { label: status, tone: 'neutral' };
}

export function ticketStatusMeta(status: string): StatusMeta {
  return TICKET_STATUS_META[status as TicketStatus] ?? { label: status, tone: 'neutral' };
}

export function ticketPriorityMeta(priority: string): StatusMeta {
  return TICKET_PRIORITY_META[priority as TicketPriority] ?? { label: priority, tone: 'neutral' };
}

export function lifecycleMeta(status: string): StatusMeta {
  return LIFECYCLE_META[status as ConversationStatus] ?? { label: status, tone: 'neutral' };
}

export function stockStatusMeta(status: string): StatusMeta {
  return STOCK_STATUS_META[status as StockStatus] ?? { label: status, tone: 'neutral' };
}

/** `pending_confirmation` -> `Pending confirmation` */
export function humanize(value: string): string {
  const spaced = value.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
