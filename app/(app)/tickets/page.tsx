import React from 'react';
import type { Metadata } from 'next';
import { fetchTickets } from '@/lib/data/tickets';
import { ErrorState, PageHeader } from '@/components/ui';
import { TicketConsole } from './TicketConsole';

export const metadata: Metadata = { title: 'Tickets' };

/**
 * Server Component. Status and type filters are URL state so a triage view can
 * be shared or reloaded, and the search box submits a GET form rather than
 * firing a debounced API request per keystroke. The console owns selection and
 * the two mutations.
 */
export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; q?: string };
}) {
  const status = searchParams.status ?? 'all';
  const type = searchParams.type ?? 'all';
  const query = searchParams.q?.trim() ?? '';

  const tickets = await fetchTickets({ status, type, search: query }).catch(() => null);

  if (tickets === null) {
    return (
      <>
        <PageHeader title="Tickets and escalations" description="Support triage queue" />
        <ErrorState
          title="Could not load tickets"
          message="The ticket queue could not be read from the database."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tickets and escalations"
        description="Triage customer incidents and fulfilment complaints"
        action={<TicketSearch defaultValue={query} status={status} type={type} />}
      />
      <TicketConsole initialTickets={tickets} />
    </>
  );
}

/**
 * A plain GET form. Progressive enhancement: it works with scripting disabled
 * and keeps the query in the URL, which a debounced onChange handler cannot do
 * without a router round trip per keystroke. The active filters ride along as
 * hidden fields so a search does not silently reset the triage view.
 */
function TicketSearch({
  defaultValue,
  status,
  type,
}: {
  defaultValue: string;
  status: string;
  type: string;
}) {
  return (
    <form role="search" action="/tickets" className="flex items-center gap-2">
      {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
      {type !== 'all' ? <input type="hidden" name="type" value={type} /> : null}
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search ticket number or description"
        aria-label="Search tickets"
        className="w-56 rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-line-strong focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/35"
      />
      <button
        type="submit"
        className="rounded-control border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
      >
        Search
      </button>
    </form>
  );
}
