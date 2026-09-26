import type { Tone } from './status';

/**
 * First-response SLA evaluation, shared by the inbox and the dashboard.
 *
 * The inbox previously had a local `slaLabel` that returned only a string and a
 * boolean, so anything else that needed to reason about a deadline had to
 * reimplement the arithmetic. It also rounded toward zero on the elapsed side,
 * which made a deadline that had just passed report "0m" rather than
 * "Breached 0m ago".
 */

export type SlaState = 'none' | 'ok' | 'due_soon' | 'breached';

/** A deadline inside this window is shown as due soon rather than comfortable. */
export const SLA_DUE_SOON_MINUTES = 60;

export interface SlaAssessment {
  state: SlaState;
  tone: Tone;
  label: string;
  /** Minutes until the deadline. Negative once breached. */
  minutesRemaining: number;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * @param deadline ISO timestamp, or null when the record has no SLA.
 * @param now Injectable for deterministic tests.
 */
export function assessSla(deadline: string | null, now: Date = new Date()): SlaAssessment | null {
  if (!deadline) return null;

  const due = new Date(deadline).getTime();
  if (Number.isNaN(due)) return null;

  // Rounded, not floored, so a deadline one minute in the past reads as
  // "Breached 1m ago" instead of "Breached 0m ago".
  const minutesRemaining = Math.round((due - now.getTime()) / 60000);
  const magnitude = Math.abs(minutesRemaining);

  if (minutesRemaining < 0) {
    return {
      state: 'breached',
      tone: 'danger',
      label: `Breached ${formatMinutes(magnitude)} ago`,
      minutesRemaining,
    };
  }
  if (minutesRemaining <= SLA_DUE_SOON_MINUTES) {
    return {
      state: 'due_soon',
      tone: 'warning',
      label: formatMinutes(magnitude),
      minutesRemaining,
    };
  }
  return {
    state: 'ok',
    tone: 'success',
    label: formatMinutes(magnitude),
    minutesRemaining,
  };
}
