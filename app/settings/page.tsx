'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface AgentProfile {
  id: string;
  full_name: string;
  role: string;
  is_online: boolean;
  last_seen_at: string | null;
}

interface WhatsappConfigStatus {
  whatsapp_token_configured: boolean;
  whatsapp_phone_number_id_configured: boolean;
  webhook_verify_token_configured: boolean;
}

type Tab = 'team' | 'whatsapp' | 'sla';

function StatusPill({ configured, label }: { configured: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        configured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`}
      />
      {label}
    </span>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('team');
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsappConfigStatus | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setAgentsError(null);
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Unable to load team members.');
      }
      setAgents((json.data ?? []) as AgentProfile[]);
    } catch (err) {
      setAgents([]);
      setAgentsError(err instanceof Error ? err.message : 'Unable to load team members.');
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    if (activeTab !== 'whatsapp' || whatsapp) return;
    let cancelled = false;

    async function load() {
      setWhatsappError(null);
      try {
        const res = await fetch('/api/integrations/whatsapp');
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error?.message || 'Unable to read the integration status.');
        }
        if (!cancelled) setWhatsapp(json.data as WhatsappConfigStatus);
      } catch (err) {
        if (!cancelled) {
          setWhatsappError(
            err instanceof Error ? err.message : 'Unable to read the integration status.'
          );
        }
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, whatsapp]);

  const tabButton = (tab: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
        activeTab === tab
          ? 'bg-[#142340] text-white shadow-sm'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#142340]">Settings &amp; User Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Team roles from the profiles table, WhatsApp credential status, and SLA policy notes
            </p>
          </div>
        </div>

        <div className="p-6 max-w-5xl w-full">
          <div className="flex gap-2 mb-6">
            {tabButton('team', 'Team & Roles')}
            {tabButton('whatsapp', 'WhatsApp API')}
            {tabButton('sla', 'SLA Rules')}
          </div>

          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#142340]">Team Members</h3>
                <button
                  type="button"
                  onClick={() => void loadAgents()}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Refresh</span>
                </button>
              </div>

              {agentsError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                  {agentsError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agentsLoading && agents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Loading team members...
                        </td>
                      </tr>
                    )}

                    {!agentsLoading && !agentsError && agents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No profiles exist yet. Rows appear as users are registered in Supabase
                          Auth.
                        </td>
                      </tr>
                    )}

                    {agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-[#142340]">{agent.full_name}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] capitalize">
                            {agent.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              agent.is_online
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {agent.is_online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {agent.last_seen_at
                            ? new Date(agent.last_seen_at).toLocaleString()
                            : 'Never recorded'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#142340]">Meta Cloud API Configuration</h3>

              {whatsappError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                  {whatsappError}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div>
                    <div className="font-bold text-slate-800">WHATSAPP_TOKEN</div>
                    <div className="text-[11px] text-slate-500">
                      Cloud API access token, read server-side only
                    </div>
                  </div>
                  {whatsapp ? (
                    <StatusPill
                      configured={whatsapp.whatsapp_token_configured}
                      label={whatsapp.whatsapp_token_configured ? 'Configured' : 'Missing'}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">Checking...</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div>
                    <div className="font-bold text-slate-800">WHATSAPP_PHONE_NUMBER_ID</div>
                    <div className="text-[11px] text-slate-500">
                      Sender number used for outbound messages
                    </div>
                  </div>
                  {whatsapp ? (
                    <StatusPill
                      configured={whatsapp.whatsapp_phone_number_id_configured}
                      label={
                        whatsapp.whatsapp_phone_number_id_configured ? 'Configured' : 'Missing'
                      }
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">Checking...</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div>
                    <div className="font-bold text-slate-800">WHATSAPP_WEBHOOK_VERIFY_TOKEN</div>
                    <div className="text-[11px] text-slate-500">
                      Shared secret for inbound webhook verification
                    </div>
                  </div>
                  {whatsapp ? (
                    <StatusPill
                      configured={whatsapp.webhook_verify_token_configured}
                      label={whatsapp.webhook_verify_token_configured ? 'Configured' : 'Missing'}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">Checking...</span>
                  )}
                </div>
              </div>

              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-[11px] leading-relaxed text-slate-500">
                Credential values are never sent to the browser. Outbound dispatch is performed by
                the server route and a missing token is reported as a failed send rather than a
                success. Set these values in the deployment environment, not in the repository.
              </p>
            </div>
          )}

          {activeTab === 'sla' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#142340]">SLA Handling</h3>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Deadlines are stored per record</div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Orders, tickets, and conversations each carry their own{' '}
                  <span className="font-mono">sla_deadline</span> column. There is no global
                  warning-window table, so the dashboard and inbox compare the current time against
                  each record&apos;s own deadline instead of applying fixed thresholds.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Open the SLA monitor
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
