'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'team' | 'whatsapp' | 'sla'>('team');

  const teamMembers = [
    { id: 'usr-1', name: 'Tariq Al-Mansoor', email: 'tariq@sowtek.sa', role: 'Agent', zone: 'Zone A', status: 'Online' },
    { id: 'usr-2', name: 'Sara Khalid', email: 'sara@sowtek.sa', role: 'Supervisor', zone: 'All Zones', status: 'Online' },
    { id: 'usr-3', name: 'Omar Al-Ghamdi', email: 'omar@sowtek.sa', role: 'Inventory', zone: 'Warehouse 1', status: 'Offline' },
    { id: 'usr-4', name: 'Zaid Al-Harbi', email: 'zaid@sowtek.sa', role: 'Delivery', zone: 'Zone B Fleet', status: 'Online' },
  ];

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#142340]">Settings & User Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Team access control, WhatsApp Cloud API, and SLA policies</p>
          </div>
        </div>

        <div className="p-6 max-w-5xl w-full">
          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'team' ? 'bg-[#142340] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              👥 Team & Roles
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'whatsapp' ? 'bg-[#142340] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              📱 WhatsApp API & Webhook
            </button>
            <button
              onClick={() => setActiveTab('sla')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'sla' ? 'bg-[#142340] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              ⏱️ SLA Rules & Escalations
            </button>
          </div>

          {/* Tab 1: Team & Roles */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#142340]">Active Team Members</h3>
                <button
                  onClick={() => alert('Invite User: Sends Supabase Auth invite link')}
                  className="px-3.5 py-1.5 bg-[#70b928] hover:bg-[#5a991f] text-white font-semibold rounded-xl text-xs transition"
                >
                  ➕ Invite Member
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Zone</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-[#142340]">{m.name}</td>
                        <td className="py-3 text-slate-500 font-mono">{m.email}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                            {m.role}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{m.zone}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              m.status === 'Online'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: WhatsApp Settings */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#142340]">Meta Cloud API WhatsApp Configuration</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 uppercase font-semibold mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="109823485720931"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 uppercase font-semibold mb-1">
                    Webhook Callback URL
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="https://sowtek.vercel.app/api/webhooks/whatsapp"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 uppercase font-semibold mb-1">
                    Webhook Verification Token
                  </label>
                  <input
                    type="password"
                    readOnly
                    value="sowtek_secure_verify_token_2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: SLA Policies */}
          {activeTab === 'sla' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#142340]">Operational SLA Thresholds</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1">SLA Warning Window</div>
                  <div className="text-amber-800">15 Minutes</div>
                  <p className="text-[11px] text-amber-700 mt-2">
                    Visual badge turns amber on Unified Inbox conversation card and pushes attention alert.
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="font-bold text-red-900 mb-1">SLA Critical Breach</div>
                  <div className="text-red-800">30 Minutes</div>
                  <p className="text-[11px] text-red-700 mt-2">
                    Escalates ticket to Supervisor Dashboard and dispatches notification to on-duty manager.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
