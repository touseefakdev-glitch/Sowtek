'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  updateConversation,
} from '@/lib/api/conversations';

interface ConversationItem {
  id: string;
  name: string;
  company: string;
  avatar: string;
  channel: 'whatsapp' | 'facebook' | 'instagram' | 'email';
  lastMessage: string;
  time: string;
  isUrgent?: boolean;
  isRtl?: boolean;
  category: 'active' | 'in-process' | 'completed';
  phone: string;
  email: string;
  orderNumber: string;
  orderTotal: string;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: '1',
    name: 'Faisal Al-Qaisi',
    company: 'Al Noor Restaurant',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbIuuXHb3vp7JVbat23Mn9wuZj-Try5MdPbVsCNeZfIuvWm8tmNKeyOMKWddPLwpJ6_apaCV8NSgP9g9DqbeOcOXCUHy7Y0ob_yGa46dNcbrSX0pfzc4n_Ra2V9sWAtzwn8GGqPiFbRUvV2KxABKIEguzHWn6gUmURj86iWeAJkXyaTNymcBemYtNl8jnCPM77v1uG1mhWxzJJ__7FdjK0DRrVo8LJ1Ndn-tl3v8AxMFtKOtgk_5PoLw',
    channel: 'whatsapp',
    lastMessage: "Thanks! We're on it.",
    time: '19:36',
    isUrgent: true,
    category: 'active',
    phone: '+966 50 123 4567',
    email: 'faisal@alnoor.sa',
    orderNumber: '#ORD-8821',
    orderTotal: 'SAR 4,820.00',
  },
  {
    id: '2',
    name: 'Khaled Al-Amrani',
    company: 'Sultan Burger Co.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDMFySBMQAOUkbKznzhhDtxfosttX8FzczeC6SY7auUmYMYTl1FkwOdhow0TjxV04WkPItTJBZsLc-_uCPGMD96dg1p8i4UTor0PFEB2LWXeYBlcPfXHtq7A15dP-YKi-3GBZTFKIhTk-N0vOHNFow8eu9gnKQt5qAxvcBhN7uJJrvuMmjsgWtcAPqd_ixpEEbeqFixhKIvJBNHJJrr0w4tw1UIbgdADZTEpiKMZs_No2VhBICpHBihQ',
    channel: 'facebook',
    lastMessage: 'شكراً جزيلاً',
    time: '19:29',
    isUrgent: true,
    isRtl: true,
    category: 'active',
    phone: '+966 55 987 6543',
    email: 'khaled@sultanburger.sa',
    orderNumber: '#ORD-8819',
    orderTotal: 'SAR 2,350.00',
  },
  {
    id: '3',
    name: 'Faisal Al-Qaisi',
    company: 'Al Noor Restaurant (Bay 3)',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkedzXwg7S9Q71hIDGqqDKNaiiStg5xoUn6iczhlKCeYZ9XwlS3tcRq0q2nPVZcDtRwowQQGOW0yxh7_xVPzPz2WWrmD4TFAej3N_uOhrtwsc5tETAPrOjlTkdJWg_AcWLNP-m8-k2eOAVHaDlnR0RZcYUhrHxfzrlCeSVVZR0NZeZzzPBTez5xdCabf7EoDFFhf0egKihpWo8J42EItA5-5m5PAoIpMMKhjav2V-MQuiu2Y79SRAD7w',
    channel: 'whatsapp',
    lastMessage: 'Feel free to ask any...',
    time: '18:09',
    isUrgent: false,
    category: 'active',
    phone: '+966 50 123 4567',
    email: 'faisal@example.com',
    orderNumber: '#ORD-8821',
    orderTotal: 'SAR 4,820.00',
  },
  {
    id: '4',
    name: 'Fatimah Madi',
    company: 'Madi Bakery',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS8odlANmqGfaviXYdU3u0NPr_OKs8cxkkJ1HAoHLSrbSlUccLnxe4wgj0a6c-vcLO4uGmfn7BXskGsLLnyixHn_rcfwgNYuJS83yeR-x7x9ELT3qGd0XuoRA41xFpnGuHMs6bM5d7PqJ0GfNrDxXsJF7-asFt9ByPzrdfMueJfZ2Knd_Yp2RoefkLCYuDxI8wGRfPoBv6Aeg6ZbTFrRsipqffh6VHjd6dCUp_kpkRn8osJGx66ybMAw',
    channel: 'whatsapp',
    lastMessage: 'أي خدمة أخرى',
    time: '17:21',
    isUrgent: false,
    isRtl: true,
    category: 'in-process',
    phone: '+966 54 321 0987',
    email: 'fatimah@madibakery.com',
    orderNumber: '#ORD-8815',
    orderTotal: 'SAR 1,120.00',
  },
  {
    id: '5',
    name: 'Hassan Al-Yahya',
    company: 'Yahya Grill House',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6UuduS6FK4Lkdrst60qRAKcUODxyQrkjdUI6fzMR7l6-aM6w0WD-Sm6GJSbu3KwBpdOv2zEIRH91WdDxxqiviVqd0j6Cd8bQop95kFBSNTf33rpCW-4f7eHy-Mu-_w2NM5KRE6iUzNejEwJQ4OZJKeMw4yhQreJ8fCqrjeAJOjyGtSuysPeAcDSkGJpApXClN6polPvgyEUk-42rN_eWBIznlHxOVq3l8QY01FOOlVkE8YnR-opLB-Q',
    channel: 'whatsapp',
    lastMessage: 'Have a great day 😊',
    time: '17:39',
    isUrgent: true,
    category: 'active',
    phone: '+966 53 456 7890',
    email: 'hassan@yahyagrill.sa',
    orderNumber: '#ORD-8812',
    orderTotal: 'SAR 6,400.00',
  },
  {
    id: '6',
    name: 'Noura Al-Ahmad',
    company: 'Aroma Cafe',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8Ze4sxz9sUTCHUlpRgUiRw62jAjqVaUhcrdsu70_EDunVqdHebROQnuM44cccIeFafHQwr9Gapqu2dexSaehDY8Y3jPi_6dOElQbJslhBf3RoDrpPYOT71Ext5PGH4H89CLXkLhmPHH7t69LU0wVi3c2Nwzs6BNwqCAc9UeDBidPks53HxvbNa8XVY0jh64DY7f1jto81mADT9HPzHxVLIO2Pll_L0MJyvso4D0Befw3fggQx-WaQQA',
    channel: 'instagram',
    lastMessage: 'Tech team will reach...',
    time: '15:16',
    isUrgent: false,
    category: 'completed',
    phone: '+966 56 123 7890',
    email: 'noura@aromacafe.sa',
    orderNumber: '#ORD-8809',
    orderTotal: 'SAR 940.00',
  },
];

interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent';
  text: string;
  time: string;
  isRead?: boolean;
  hasAttachment?: boolean;
  attachmentName?: string;
  attachmentSize?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'customer',
    text: 'Hi, I wanted to inquire about my recent transaction. I noticed a duplicate charge on my credit card, here I attached.',
    time: '17:28',
  },
  {
    id: 'm2',
    sender: 'agent',
    text: "I'm sorry to hear that. Could you please provide the invoice so I can check it for you?",
    time: '17:28',
    isRead: true,
  },
  {
    id: 'm3',
    sender: 'customer',
    text: 'Sure here it is, please check it out.',
    time: '17:30',
    hasAttachment: true,
    attachmentName: 'invoice_ORD8821.pdf',
    attachmentSize: '324 KB',
  },
  {
    id: 'm4',
    sender: 'agent',
    text: "Thank you! I'll look into it right away. It seems like the transaction was mistakenly processed twice. I've filed a dispute for you, and the amount should be refunded within 5-7 business days.",
    time: '17:32',
    isRead: true,
  },
];

export default function UnifiedInboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [selectedChat, setSelectedChat] = useState<ConversationItem>(INITIAL_CONVERSATIONS[2]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'in-process' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: 'agent',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    showToast('WhatsApp message sent successfully');
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesCategory =
      categoryFilter === 'all' ? true : c.category === categoryFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-700 bg-[#f1f3f7] antialiased selection:bg-lime-500 selection:text-white">
      {/* App Sidebar */}
      <AppSidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="h-14 bg-transparent px-5 flex items-center justify-between flex-shrink-0"
          data-purpose="top-header"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Unified Inbox</h1>

            {/* Channel Pills */}
            <div className="flex items-center gap-1.5 pl-1">
              <div
                className="w-6 h-6 rounded-full bg-[#84d658] flex items-center justify-center text-white shadow-xs cursor-pointer"
                title="WhatsApp Active"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
                </svg>
              </div>
              <div
                className="w-6 h-6 rounded-full bg-[#2080f6] flex items-center justify-center text-white text-[11px] font-bold shadow-xs cursor-pointer"
                title="Email Channels"
              >
                @
              </div>
              <div
                className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-xs cursor-pointer"
                title="WhatsApp Business"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
                </svg>
              </div>
              <div
                className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[11px] font-bold shadow-xs cursor-pointer"
                title="Twitter / X"
              >
                𝕏
              </div>
              <div
                className="w-6 h-6 rounded-full bg-[#0a66c2] flex items-center justify-center text-white text-[10px] font-bold shadow-xs cursor-pointer"
                title="LinkedIn"
              >
                in
              </div>
              <div
                className="w-6 h-6 rounded-full bg-[#1877f2] flex items-center justify-center text-white text-[11px] font-bold shadow-xs cursor-pointer"
                title="Facebook"
              >
                f
              </div>
              <div
                className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-xs cursor-pointer"
                title="Instagram"
              >
                📷
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-1 rounded-md text-slate-600 cursor-pointer">
              EN | العربية
            </span>
            <Link
              href="/orders/new"
              className="px-3 py-1.5 bg-[#142340] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors no-underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>New Order / PO</span>
            </Link>
          </div>
        </header>

        {/* 3 Floating Cards Layout */}
        <div className="flex-1 flex gap-3 px-5 pb-4 overflow-hidden">
          {/* CARD 1: CONVERSATION LIST */}
          <section
            className="w-72 lg:w-80 flex-shrink-0 bg-white rounded-2xl shadow-card border border-slate-200/80 flex flex-col overflow-hidden"
            data-purpose="conversation-list-card"
          >
            {/* Search & Tabs inside Card */}
            <div className="p-3 border-b border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 6h16M4 12h8m-8 6h16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                <div className="relative flex-1">
                  <input
                    className="w-full pl-3 pr-7 py-1.5 text-xs bg-slate-50 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white border border-transparent focus:border-slate-200"
                    placeholder="Find an Interaction..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* Segmented Pill Tabs */}
              <div className="flex items-center justify-between text-[11px] font-semibold bg-slate-100/70 p-0.5 rounded-lg text-slate-600">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`flex-1 py-1 px-1.5 rounded-md transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Active <span className="text-blue-500 font-normal">10</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('in-process')}
                  className={`flex-1 py-1 px-1.5 rounded-md transition-all ${
                    categoryFilter === 'in-process'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  In Process <span className="text-amber-600 font-normal">12</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('completed')}
                  className={`flex-1 py-1 px-1.5 rounded-md transition-all ${
                    categoryFilter === 'completed'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Completed <span className="text-emerald-600 font-normal">99</span>
                </button>
              </div>
            </div>

            {/* Conversations Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.map((item) => {
                const isSelected = selectedChat.id === item.id;
                return (
                  <article
                    key={item.id}
                    onClick={() => setSelectedChat(item)}
                    className={`p-3 cursor-pointer transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#eef4fd] border-l-4 border-[#2463eb]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        alt={item.name}
                        className={`w-9 h-9 rounded-full object-cover ring-1 ${
                          isSelected ? 'ring-2 ring-blue-300' : 'ring-slate-200'
                        }`}
                        src={item.avatar}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 bg-[#25D366] text-white p-0.5 rounded-full ring-2 ring-white">
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                        <span
                          className={`text-[10px] flex items-center gap-1 font-medium ${
                            item.isUrgent ? 'text-slate-400' : 'text-emerald-600 font-semibold'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isUrgent ? 'bg-rose-400' : 'bg-emerald-500'
                            }`}
                          />
                          {item.time}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] text-slate-500 truncate mt-0.5 ${
                          item.isRtl ? 'font-sans' : ''
                        }`}
                        dir={item.isRtl ? 'rtl' : 'ltr'}
                      >
                        {item.lastMessage}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* CARD 2: MIDDLE CHAT PANEL */}
          <section
            className="flex-1 min-w-0 bg-white rounded-2xl shadow-card border border-slate-200/80 flex flex-col overflow-hidden"
            data-purpose="chat-stream-card"
          >
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <img
                    alt={selectedChat.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                    src={selectedChat.avatar}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 bg-[#25D366] text-white p-0.5 rounded-full ring-2 ring-white">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
                    </svg>
                  </span>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-slate-900 leading-tight truncate">
                      {selectedChat.name}
                    </h2>
                    <span className="text-xs text-slate-400 font-normal truncate">
                      ({selectedChat.company})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="text-slate-500 font-medium">{selectedChat.orderNumber}</span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Session
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Header Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="px-2.5 py-1 rounded-full border border-emerald-300 text-emerald-700 text-xs font-semibold bg-emerald-50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>23:59</span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Chat marked as resolved.')}
                  className="px-3.5 py-1.5 rounded-full bg-[#f97346] hover:bg-[#ea5d30] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  End Chat
                </button>
              </div>
            </div>

            {/* Sub-tabs Bar */}
            <div className="px-5 border-b border-slate-100 flex items-center gap-6 text-xs font-medium text-slate-500">
              <button className="py-2.5 text-slate-900 font-bold border-b-2 border-slate-900 transition-colors">
                Inbox
              </button>
              <button className="py-2.5 hover:text-slate-900 transition-colors">Agent Script</button>
              <button className="py-2.5 hover:text-slate-900 transition-colors">Internal Notes</button>
              <button className="py-2.5 hover:text-slate-900 transition-colors">Templates</button>
            </div>

            {/* Messages Stream Viewport */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
              <div className="flex items-center justify-center my-1">
                <span className="px-4 py-0.5 rounded-full border border-slate-200 text-slate-500 text-[11px] font-medium bg-slate-50">
                  Today
                </span>
              </div>

              {messages.map((m) => {
                if (m.sender === 'customer') {
                  return (
                    <div key={m.id} className="flex items-start gap-2.5 max-w-lg">
                      <img
                        alt={selectedChat.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 ring-1 ring-slate-200"
                        src={selectedChat.avatar}
                      />
                      <div className="space-y-2">
                        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl rounded-tl-sm text-xs text-slate-800 leading-relaxed shadow-subtle">
                          {m.text}
                        </div>
                        {m.hasAttachment && (
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-3 w-64 shadow-subtle">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center flex-shrink-0 font-black text-[10px]">
                              PDF
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {m.attachmentName}
                              </p>
                              <p className="text-[10px] text-slate-400">{m.attachmentSize}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => showToast('Downloading invoice attachment...')}
                              className="text-slate-400 hover:text-slate-700 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 ml-1 block">{m.time}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className="flex items-start justify-end gap-2.5 max-w-lg ml-auto">
                    <div className="flex flex-col items-end">
                      <div className="bg-[#edf8e7] border border-[#d6eed0] p-3 rounded-2xl rounded-tr-sm text-xs text-slate-800 leading-relaxed shadow-subtle text-left">
                        {m.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 mr-1 text-[10px] text-slate-400 font-medium">
                        <span>{m.time}</span>
                        <span className="text-emerald-600 font-bold">✓✓</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#142340] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-200">
                      KO
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Templates Bar */}
            <div className="px-5 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputText('Your wholesale delivery is scheduled for tomorrow at 10:30 AM.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                >
                  ⚡ Delivery Confirmation
                </button>
                <button
                  type="button"
                  onClick={() => setInputText('We have confirmed your purchase order items and stock is allocated.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                >
                  📦 Order Confirmed
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Template library opened')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Add Template</span>
                </button>
              </div>
            </div>

            {/* Message Composer Box */}
            <div className="p-4 pt-1 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage} className="space-y-2">
                <textarea
                  className="w-full text-xs p-2 rounded-lg border-0 focus:ring-0 placeholder-slate-400 resize-none"
                  placeholder="Type WhatsApp message here..."
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setInputText((prev) => `${prev} 👍`)}
                      className="hover:text-slate-600 p-1"
                      title="Emoji"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Attachment dialog opened')}
                      className="hover:text-slate-600 p-1"
                      title="Attach file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Voice note recorded')}
                      className="hover:text-slate-600 p-1"
                      title="Voice note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#142340] hover:bg-slate-800 text-white text-xs font-bold rounded-full transition-all shadow-xs"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* CARD 3: RIGHT COLUMN - CUSTOMER 360 & HISTORY */}
          <aside
            className="w-72 lg:w-80 flex-shrink-0 bg-white rounded-2xl shadow-card border border-slate-200/80 flex flex-col overflow-hidden"
            data-purpose="customer-360-card"
          >
            {/* Top Search Contact Input */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <input
                className="w-full text-xs text-slate-700 placeholder-slate-400 bg-transparent border-0 focus:ring-0 p-0"
                placeholder="Find a Contact..."
                type="text"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Contact Header Profile Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      alt={selectedChat.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                      src={selectedChat.avatar}
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {selectedChat.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedChat.company}</p>
                  </div>
                </div>
              </div>

              {/* Quick Channel Circle Buttons */}
              <div className="flex items-center justify-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => showToast(`Calling ${selectedChat.phone}`)}
                  className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600"
                  title="Call"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`Opening WhatsApp chat with ${selectedChat.phone}`)}
                  className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-emerald-600"
                  title="WhatsApp"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`Composing email to ${selectedChat.email}`)}
                  className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600"
                  title="Email"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>

              {/* View 360 Profile CTA */}
              <div>
                <Link
                  href="/contacts/rest-1"
                  className="block w-full py-2 px-4 rounded-xl bg-[#70b928] hover:bg-[#62a422] text-white font-bold text-xs shadow-sm transition-colors text-center no-underline"
                >
                  View 360° Profile
                </Link>
              </div>

              {/* Key Details List */}
              <div className="space-y-2 py-2 border-t border-b border-slate-100 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Email</span>
                  <span className="font-semibold text-slate-800">{selectedChat.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedChat.phone}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Job role</span>
                  <span className="font-semibold text-slate-800">Procurement Manager</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Company</span>
                  <span className="font-semibold text-slate-800">{selectedChat.company}</span>
                </div>
              </div>

              {/* Order Context Quick Card */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Active Order {selectedChat.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    {selectedChat.orderTotal}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Basmati Rice (10x), San Marzano Tomatoes (15x), Mozzarella (20kg)
                </p>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  <span>Delivery: Tomorrow 10:30 AM</span>
                  <Link
                    href="/inbox/order/ORD-8821"
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <div className="flex border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <button className="pb-2 border-b-2 border-slate-900 text-slate-900 font-bold">
                    Interaction History
                  </button>
                </div>
                <div className="space-y-3 pt-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#2080f6] text-white flex items-center justify-center text-[11px] font-bold">
                        @
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">Email</p>
                        <p className="text-[10px] text-slate-400">orders@sowtek.io</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block">Today 17:28</span>
                      <span className="text-emerald-500 text-xs">↓</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#70b928] text-white flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">Phone Call</p>
                        <p className="text-[10px] text-slate-400">{selectedChat.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block">Yesterday</span>
                      <span className="text-emerald-500 text-xs">↓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2.5 transition-all z-50 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
