'use client';

import React, { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/lib/api/orders';
import type { OrderDetail } from '@/lib/data/orders';
import {
  ORDER_STATUSES,
  ORDER_STATUS_FLOW,
  isOrderStatus,
  orderStatusMeta,
  type OrderStatus,
} from '@/lib/domain/status';
import { Button, Card, CardBody, CardHeader, ErrorState, OrderStatusBadge } from '@/components/ui';

/**
 * The happy path, in order. `cancelled` is excluded on purpose: it is an
 * off-ramp from any pre-delivery state rather than the final step, so counting
 * it in the progress denominator made a cancelled order read as "step 12 of
 * 12", i.e. complete.
 */
const PROGRESS_PATH = ORDER_STATUSES.filter((status) => status !== 'cancelled');

/**
 * Offer exactly the transitions the domain graph allows from the current
 * state. The previous version listed every actionable status as a button
 * regardless of the current state, so the UI invited an agent to move an order
 * from draft straight to paid and relied on the API to refuse it.
 *
 * ORDER_STATUS_FLOW is authoritative here rather than
 * ORDER_ACTIONABLE_STATUSES: the flow includes out_for_delivery -> delivered
 * -> invoiced -> paid, which are legitimate transitions but are not themselves
 * "actionable" queue states, so intersecting the two lists would have made it
 * impossible to mark an order delivered from this page.
 */
function allowedTransitions(current: string): readonly OrderStatus[] {
  if (!isOrderStatus(current)) return [];
  return ORDER_STATUS_FLOW[current];
}

export function OrderStatusControl({ order }: { order: OrderDetail }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentStatus = order.status;
  const transitions = allowedTransitions(currentStatus);
  const isTerminal = transitions.length === 0;

  const currentIndex = PROGRESS_PATH.indexOf(currentStatus as (typeof PROGRESS_PATH)[number]);
  const progress =
    currentIndex < 0 ? 0 : Math.round(((currentIndex + 1) / PROGRESS_PATH.length) * 100);

  const handleChange = (next: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, next);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'The status update was rejected by the API.'
        );
      }
    });
  };

  return (
    <Card>
      <CardHeader title="Fulfilment status" action={<OrderStatusBadge status={currentStatus} />} />
      <CardBody>
        <p className="mb-4 text-[11px] text-ink-subtle">
          Every change is written to <span className="font-mono">order_status_history</span> and the
          customer is notified on WhatsApp when the status becomes{' '}
          <span className="font-mono">delivered</span>.
        </p>

        {error ? <ErrorState message={error} className="mb-3" /> : null}

        {isTerminal ? (
          <p className="rounded-card border border-dashed border-line-strong px-4 py-6 text-center text-xs text-ink-subtle">
            This order is in a terminal state, so no further status changes are possible.
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Fulfilment progress"
                className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line"
              >
                <div
                  className="h-full rounded-pill bg-lime transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-ink-subtle">
                Step {currentIndex + 1} of {PROGRESS_PATH.length}
              </span>
            </div>

            <div role="group" aria-label="Available status transitions" className="flex flex-wrap gap-2">
              {transitions.map((status) => (
                <Button
                  key={status}
                  variant={status === currentStatus ? 'primary' : 'secondary'}
                  disabled={pending || status === currentStatus}
                  onClick={() => handleChange(status)}
                  aria-current={status === currentStatus ? 'true' : undefined}
                >
                  {orderStatusMeta(status).label}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
