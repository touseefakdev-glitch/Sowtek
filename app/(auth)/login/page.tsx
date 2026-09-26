'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      router.push('/inbox');
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between text-slate-800 antialiased selection:bg-[#eef8eb] selection:text-[#2c771c] bg-[#f1f3f7] ${
        lang === 'ar' ? 'rtl' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Right Utility Bar: Language Switcher */}
      <div className="w-full px-8 py-6 flex justify-between items-center z-10">
        <div />

        {/* Language toggle: EN | Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© */}
        <div className="inline-flex items-center bg-white border border-slate-200/90 rounded-xl p-1 shadow-subtle">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'en' ? 'bg-[#142340] text-white shadow-subtle' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('ar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'ar' ? 'bg-[#142340] text-white shadow-subtle' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©
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
                {lang === 'ar' ? 'Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ø¹ÙˆØ¯ØªÙƒ' : 'Welcome back'}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5">
                {lang === 'ar'
                  ? 'Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø¨ÙŠØ§Ù†Ø§Øª ÙˆÙƒÙŠÙ„Ùƒ Ù„Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ ØµÙ†Ø¯ÙˆÙ‚ Ø§Ù„ÙˆØ§Ø±Ø¯ Ø§Ù„Ù…ÙˆØ­Ø¯'
                  : 'Sign in with your agent credentials to access the Unified Inbox'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù„Ù„Ø¹Ù…Ù„' : 'Work Email Address'}
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
                    {lang === 'ar' ? 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        setErrorMessage('Enter your work email first, then request a reset link.');
                        return;
                      }
                      try {
                        const supabase = createClient();
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/login`,
                        });
                        setErrorMessage(
                          error
                            ? error.message
                            : 'If that email is registered, a password reset link has been sent.'
                        );
                      } catch (err) {
                        setErrorMessage(
                          err instanceof Error
                            ? err.message
                            : 'Unable to request a password reset.'
                        );
                      }
                    }}
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

              {/* Auth Error */}
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <span className="material-symbols-outlined text-[16px] text-red-500">
                    error
                  </span>
                  <span>{errorMessage}</span>
                </div>
              )}

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
                      {lang === 'ar' ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù‡ÙˆÙŠØ©...' : 'Authenticating...'}
                    </span>
                  ) : (
                    <>
                      <span>{lang === 'ar' ? 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ù†Ø¸Ø§Ù…' : 'Sign in to OrderFlow'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="w-full px-8 py-5 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-2 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Sowtek OrderFlow</span>
          <span>â€¢</span>
          <span>Restaurant Supply Logistics OS</span>
        </div>
      </footer>
    </div>
  );
}
