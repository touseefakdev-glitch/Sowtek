import { Badge } from './Badge';
import {
  orderStatusMeta,
  ticketStatusMeta,
  ticketPriorityMeta,
  stockStatusMeta,
  type Tone,
} from '@/lib/domain/status';

/**
 * Domain status bound to the Badge primitive. Pages render status through
 * these so a given status always looks and reads identically, and the
 * wording lives in exactly one module.
 */

const TONE_ICON: Partial<Record<Tone, string>> = {
  success: 'check_circle',
  danger: 'cancel',
  warning: 'schedule',
  info: 'pending',
};

function StatusBadge({
  meta,
  withIcon,
  dot,
}: {
  meta: { label: string; tone: Tone };
  withIcon: boolean;
  dot?: boolean;
}) {
  return (
    <Badge tone={meta.tone} icon={withIcon ? TONE_ICON[meta.tone] : undefined} dot={dot}>
      {meta.label}
    </Badge>
  );
}

export function OrderStatusBadge({
  status,
  withIcon = true,
}: {
  status: string;
  withIcon?: boolean;
}) {
  return <StatusBadge meta={orderStatusMeta(status)} withIcon={withIcon} />;
}

export function TicketStatusBadge({ status }: { status: string }) {
  return <StatusBadge meta={ticketStatusMeta(status)} withIcon />;
}

export function PriorityBadge({
  priority,
  withIcon = true,
}: {
  priority: string;
  withIcon?: boolean;
}) {
  return <StatusBadge meta={ticketPriorityMeta(priority)} withIcon={withIcon} />;
}

export function StockBadge({ status }: { status: string }) {
  return <StatusBadge meta={stockStatusMeta(status)} withIcon />;
}
