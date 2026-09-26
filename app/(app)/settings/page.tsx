import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchAgents, getWhatsAppConfigStatus, type AgentProfile } from '@/lib/data/team';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  PageBody,
  PageHeader,
  RefreshButton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { humanize } from '@/lib/domain/status';
import { formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Settings' };

const TABS = [
  { id: 'team', label: 'Team and roles' },
  { id: 'whatsapp', label: 'WhatsApp API' },
  { id: 'sla', label: 'SLA rules' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function ConfigRow({
  name,
  description,
  configured,
}: {
  name: string;
  description: string;
  configured: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface-sunken px-3 py-2.5">
      <div className="min-w-0">
        <p className="font-mono text-xs font-bold text-ink">{name}</p>
        <p className="text-[11px] text-ink-muted">{description}</p>
      </div>
      <Badge tone={configured ? 'success' : 'warning'} dot>
        {configured ? 'Configured' : 'Missing'}
      </Badge>
    </li>
  );
}

function TeamTab({ agents }: { agents: AgentProfile[] | null }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Team members"
        action={<RefreshButton />}
      />
      {agents === null ? (
        <CardBody>
          <ErrorState message="Unable to load team members." />
        </CardBody>
      ) : agents.length === 0 ? (
        <EmptyState
          icon="group"
          title="No team members yet"
          description="Profiles appear here as users are registered in Supabase Auth."
          className="border-0"
        />
      ) : (
        <Table>
          <caption className="sr-only">Team members and their roles</caption>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Last seen</TH>
            </TR>
          </THead>
          <TBody>
            {agents.map((agent) => (
              <TR key={agent.id}>
                <TD className="font-bold text-ink">{agent.full_name}</TD>
                <TD>
                  <Badge tone="neutral">{humanize(agent.role ?? 'agent')}</Badge>
                </TD>
                <TD>
                  <Badge tone={agent.is_online ? 'success' : 'neutral'} dot>
                    {agent.is_online ? 'Online' : 'Offline'}
                  </Badge>
                </TD>
                <TD className="text-ink-muted">{formatRelative(agent.last_seen_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}

function WhatsAppTab() {
  const status = getWhatsAppConfigStatus();

  return (
    <Card>
      <CardHeader title="Meta Cloud API configuration" />
      <CardBody>
        <ul className="space-y-3">
          <ConfigRow
            name="WHATSAPP_TOKEN"
            description="Cloud API access token, read server-side only"
            configured={status.whatsappToken}
          />
          <ConfigRow
            name="WHATSAPP_PHONE_NUMBER_ID"
            description="Sender number used for outbound messages"
            configured={status.whatsappPhoneNumberId}
          />
          <ConfigRow
            name="WHATSAPP_WEBHOOK_VERIFY_TOKEN"
            description="Shared secret for inbound webhook verification"
            configured={status.webhookVerifyToken}
          />
        </ul>

        <p className="mt-4 rounded-card border border-dashed border-line-strong p-4 text-[11px] leading-relaxed text-ink-muted">
          Credential values are never sent to the browser. Outbound dispatch is performed by the
          server route, and a missing token is reported as a failed send rather than a success. Set
          these values in the deployment environment, not in the repository.
        </p>
      </CardBody>
    </Card>
  );
}

function SlaTab() {
  return (
    <Card>
      <CardHeader title="SLA handling" />
      <CardBody>
        <div className="space-y-2 rounded-card border border-line bg-surface-sunken p-4">
          <p className="font-bold text-ink">Deadlines are stored per record</p>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Orders, tickets and conversations each carry their own{' '}
            <span className="font-mono">sla_deadline</span> column. There is no global
            warning-window table, so the dashboard and inbox compare the current time against each
            record&rsquo;s own deadline instead of applying fixed thresholds.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-control bg-surface px-3 py-1.5 text-[11px] font-semibold text-ink transition hover:bg-ink hover:text-white"
          >
            Open the SLA monitor
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * Server Component with URL-driven tabs, so a specific settings pane can be
 * linked to and survives a refresh. Nothing here needs client state, which
 * removes the loading and error states the tabbed version had to manage.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const requested = searchParams.tab;
  const activeTab: TabId = TABS.some((tab) => tab.id === requested)
    ? (requested as TabId)
    : 'team';

  const agents = activeTab === 'team' ? await fetchAgents().catch(() => null) : null;

  return (
    <>
      <PageHeader
        title="Settings and user management"
        description="Team roles, WhatsApp credential status and SLA policy"
      />

      <PageBody className="max-w-4xl">
        <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.id === 'team' ? '/settings' : `/settings?tab=${tab.id}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={
                activeTab === tab.id
                  ? 'rounded-control bg-ink px-4 py-2 text-xs font-semibold text-white transition'
                  : 'rounded-control border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink-muted transition hover:bg-surface-sunken hover:text-ink'
              }
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {activeTab === 'team' ? <TeamTab agents={agents} /> : null}
        {activeTab === 'whatsapp' ? <WhatsAppTab /> : null}
        {activeTab === 'sla' ? <SlaTab /> : null}
      </PageBody>
    </>
  );
}
