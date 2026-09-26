import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchContacts } from '@/lib/data/contacts';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageBody,
  PageHeader,
} from '@/components/ui';
import { formatCurrency, formatNumber, initials } from '@/lib/format';

export const metadata: Metadata = { title: 'Restaurant accounts' };

/**
 * Server Component: the directory is read-only apart from the search box, so
 * the accounts are resolved on the server and the search term is read from the
 * URL rather than held in client state.
 */
export default async function ContactsDirectoryPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams.search ?? '';
  const contacts = await fetchContacts({ search: search || undefined }).catch(() => null);

  return (
    <>
      <PageHeader
        title="Restaurant accounts"
        description="Customer profiles, WhatsApp endpoints and credit lines"
        action={
          <Link href="/inbox">
            <Button variant="primary" icon="chat">
              Open WhatsApp inbox
            </Button>
          </Link>
        }
      />

      <PageBody>
        <form className="mb-6" action="/contacts" method="get" role="search">
          <label htmlFor="contact-search" className="sr-only">
            Search restaurant accounts
          </label>
          <input
            id="contact-search"
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by restaurant name, phone or WhatsApp number"
            className="w-full max-w-md rounded-control border border-line bg-surface px-4 py-2.5 text-sm text-ink transition placeholder:text-ink-subtle focus:border-lime focus:outline-none focus:ring-4 focus:ring-lime/20"
          />
        </form>

        {contacts === null ? (
          <ErrorState message="Could not load restaurant accounts." />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon="storefront"
            title="No restaurant accounts"
            description={
              search
                ? `No accounts match "${search}".`
                : 'Restaurant accounts are created in the restaurants table and appear here automatically.'
            }
            className="border-0"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="flex flex-col justify-between transition hover:shadow-card-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      aria-hidden
                      className="flex h-10 w-10 items-center justify-center rounded-control bg-ink text-sm font-bold text-lime"
                    >
                      {initials(contact.name)}
                    </span>
                    <Badge tone="neutral">{contact.delivery_zone || 'Zone not set'}</Badge>
                  </div>

                  <h2 className="mt-3 text-sm font-bold text-ink">{contact.name}</h2>
                  {contact.name_ar ? (
                    <p lang="ar" dir="rtl" className="font-arabic text-xs text-ink-subtle">
                      {contact.name_ar}
                    </p>
                  ) : null}

                  <p className="mt-2 font-mono text-xs text-ink-muted">
                    {contact.whatsapp_number || 'No WhatsApp number'}
                  </p>

                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center text-xs">
                    <div className="rounded-control bg-surface-sunken p-2">
                      <dt className="block text-[10px] font-semibold text-ink-subtle">Active</dt>
                      <dd className="font-bold text-ink">{formatNumber(contact.open_orders_count)}</dd>
                    </div>
                    <div className="rounded-control bg-surface-sunken p-2">
                      <dt className="block text-[10px] font-semibold text-ink-subtle">Tickets</dt>
                      <dd className="font-bold text-ink">{formatNumber(contact.open_tickets_count)}</dd>
                    </div>
                    <div className="rounded-control bg-surface-sunken p-2">
                      <dt className="block text-[10px] font-semibold text-ink-subtle">Spend</dt>
                      <dd className="font-bold text-lime-700">
                        {formatCurrency(contact.total_spend)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <Link
                  href={`/contacts/${contact.id}`}
                  className="mt-5 w-full rounded-control bg-surface-sunken py-2 text-center text-xs font-semibold text-ink transition hover:bg-ink hover:text-white"
                >
                  View 360° profile
                </Link>
              </Card>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
