'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('kenneth.ofkeli@sowtek.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      showToast(lang === 'ar' ? 'جاري التحقق من الهوية...' : 'Authenticating agent credentials...');
      setTimeout(() => {
        router.push('/inbox');
      }, 1000);
    } catch {
      showToast('Login failed. Check credentials.');
      setLoading(false);
    }
  };

  const selectAgent = (name: string, agentEmail: string, role: string) => {
    setEmail(agentEmail);
    showToast(`Selected profile: ${name} (${role})`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between text-slate-800 antialiased selection:bg-[#eef8eb] selection:text-[#2c771c] bg-[#f1f3f7] ${
        lang === 'ar' ? 'rtl' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Right Utility Bar: Language Switcher and System Status */}
      <div className="w-full px-8 py-6 flex justify-between items-center z-10">
        {/* Subtle Live Platform Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70b928] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#70b928]" />
          </span>
          <span className="text-[11px] font-semibold text-slate-600">WhatsApp Gateway Active</span>
          <span className="text-slate-300 text-xs">|</span>
          <span className="text-[11px] font-medium text-slate-500">4 Agents Online</span>
        </div>

        {/* Language toggle: EN | العربية */}
        <div className="inline-flex items-center bg-white border border-slate-200/90 rounded-xl p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'en' ? 'bg-[#142340] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('ar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'ar' ? 'bg-[#142340] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            العربية
          </button>
        </div>
      </div>

      {/* Main Content Container: Centered Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 -mt-6">
        <div className="w-full max-w-[440px]">
          {/* Card Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 sm:p-10 relative">
            {/* Sowtek Logo Top Center */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3">
                {/* Brand Navy Logo Mark */}
                <div className="w-10 h-10 rounded-xl bg-[#142340] flex items-center justify-center shadow-md shadow-[#142340]/10 text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 8C4 5.79086 5.79086 4 8 4H10C11.1046 4 12 4.89543 12 6V8C12 9.10457 11.1046 10 10 10H6C4.89543 10 4 10.8954 4 12V14C4 15.1046 4.89543 16 6 16H8C9.10457 16 10 16.8954 10 18V20H8C5.79086 20 4 18.2091 4 16V8Z"
                      fill="currentColor"
                    />
                    <path
                      d="M20 16C20 18.2091 18.2091 20 16 20H14C12.8954 20 12 19.1046 12 18V16C12 14.8954 12.8954 14 14 14H18C19.1046 14 20 13.1046 20 12V10C20 8.89543 19.1046 8 18 8H16C14.8954 8 14 7.10457 14 6V4H16C18.2091 4 20 5.79086 20 8V16Z"
                      fill="#70b928"
                    />
                  </svg>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-black text-[#142340] tracking-tight leading-none">sowtek</span>
                  <span className="text-[9px] font-bold tracking-widest text-[#70b928] uppercase mt-0.5">ORDERFLOW</span>
                </div>
              </div>

              <div className="mt-4 px-2.5 py-0.5 rounded-full bg-[#eef8eb] border border-[#d6eed0] text-[10px] font-bold text-[#2c771c] inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#70b928]" />
                B2B Restaurant Supplier Portal
              </div>
            </div>

            {/* Headline & Subtitle */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-black text-[#142340] tracking-tight">
                {lang === 'ar' ? 'مرحباً بعودتك' : 'Welcome back'}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5">
                {lang === 'ar'
                  ? 'سجّل الدخول باستخدام بيانات وكيلك للوصول إلى صندوق الوارد الموحد'
                  : 'Sign in with your agent credentials to access the Unified Inbox'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'البريد الإلكتروني للعمل' : 'Work Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@sowtek.io"
                    className="block w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white border border-slate-200/90 rounded-xl focus:ring-2 focus:ring-[#142340]/20 focus:border-[#142340] transition placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast('Password reset link sent to registered email')}
                    className="text-[11px] font-medium text-slate-500 hover:text-[#142340] transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="block w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 bg-white border border-slate-200/90 rounded-xl focus:ring-2 focus:ring-[#142340]/20 focus:border-[#142340] transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Shift Status */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-[#142340] border-slate-300 rounded focus:ring-[#142340] cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 select-none">
                    {lang === 'ar' ? 'تذكر محطة العمل هذه' : 'Remember this workstation'}
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-700">Shift Active</span>
                </div>
              </div>

              {/* Primary CTA: "Sign in" */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#142340] hover:bg-slate-800 text-white rounded-xl py-3 px-4 text-xs font-bold transition shadow-md shadow-[#142340]/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#142340] focus:ring-offset-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Authenticating Kenneth Ofkeli...
                    </span>
                  ) : (
                    <>
                      <span>{lang === 'ar' ? 'تسجيل الدخول إلى النظام' : 'Sign in to OrderFlow'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Switch Demo Profile */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
                Quick Switch Agent Profile
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectAgent('Kenneth Ofkeli', 'kenneth.ofkeli@sowtek.io', 'Senior Agent')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/90 hover:border-[#142340] hover:bg-slate-50 transition text-left group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#142340] text-white flex items-center justify-center text-[10px] font-bold group-hover:bg-[#70b928] transition">
                    KO
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Kenneth O.</p>
                    <p className="text-[10px] text-slate-500 truncate">Senior Agent</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectAgent('Sarah Tariq', 'sarah.tariq@sowtek.io', 'Supervisor')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/90 hover:border-[#142340] hover:bg-slate-50 transition text-left group"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold group-hover:bg-[#70b928] group-hover:text-white transition">
                    ST
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Sarah Tariq</p>
                    <p className="text-[10px] text-slate-500 truncate">Supervisor</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-5 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-slate-400">verified_user</span>
                <span>Protected by Sowtek Enterprise 2FA & SSL</span>
              </p>
            </div>
          </div>

          {/* Secondary Help Link */}
          <div className="text-center mt-5">
            <p className="text-xs text-slate-500">
              Need access or report a dispatch issue?{' '}
              <button
                type="button"
                onClick={() => showToast('Supervisor support desk notified.')}
                className="font-semibold text-[#142340] hover:text-[#70b928] underline underline-offset-2 transition"
              >
                Contact Supervisor
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="w-full px-8 py-5 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-2 border-t border-slate-200/60 bg-white/40 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Sowtek OrderFlow</span>
          <span>•</span>
          <span>Restaurant Supply Logistics OS</span>
          <span>•</span>
          <span>v2.4.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-600 transition cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-600 transition cursor-pointer">SLA Terms</span>
          <span className="hover:text-slate-600 transition cursor-pointer">System Status</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            All Systems Normal
          </span>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2.5 transition-all z-50">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
