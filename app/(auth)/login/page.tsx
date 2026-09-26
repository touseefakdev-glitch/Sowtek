'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { Logo } from '@/components/brand/Logo';

const COPY = {
  en: {
    welcome: 'Welcome back',
    subtitle: 'Sign in with your agent credentials to access the Unified Inbox',
    email: 'Work Email Address',
    password: 'Password',
    forgot: 'Forgot password?',
    signIn: 'Sign in to OrderFlow',
    authenticating: 'Authenticating...',
    portal: 'B2B Restaurant Supplier Portal',
    enterEmailFirst: 'Enter your work email first, then request a reset link.',
    resetSent: 'If that email is registered, a password reset link has been sent.',
    resetFailed: 'Unable to request a password reset.',
    loginFailed: 'Unable to sign in. Please try again.',
  },
  ar: {
    welcome: 'أهلاً بعودتك',
    subtitle: 'سجّل الدخول ببيانات الوكيل للوصول إلى صندوق الوارد الموحد',
    email: 'البريد الإلكتروني للعمل',
    password: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    signIn: 'تسجيل الدخول إلى OrderFlow',
    authenticating: 'جارٍ التحقق من بياناتك...',
    portal: 'بوابة موردي المطاعم',
    enterEmailFirst: 'أدخل بريدك الإلكتروني أولاً ثم اطلب رابط إعادة التعيين.',
    resetSent: 'إذا كان البريد مسجلاً، فقد تم إرسال رابط إعادة تعيين كلمة المرور.',
    resetFailed: 'تعذّر طلب إعادة تعيين كلمة المرور.',
    loginFailed: 'تعذّر تسجيل الدخول. حاول مرة أخرى.',
  },
} as const;

type Lang = keyof typeof COPY;

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; message: string } | null>(null);

  const copy = COPY[lang];
  const rtl = lang === 'ar';

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const { error } = await createClient().auth.signInWithPassword({ email, password });

    if (error) {
      setNotice({ tone: 'error', message: error.message });
      setLoading(false);
      return;
    }

    router.replace('/inbox');
    router.refresh();
  };

  const handleReset = async () => {
    if (!email) {
      setNotice({ tone: 'error', message: copy.enterEmailFirst });
      return;
    }

    setNotice(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setNotice({ tone: 'info', message: error ? error.message : copy.resetSent });
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface-sunken text-ink antialiased selection:bg-lime-tint selection:text-lime-800">
      <div className="z-10 flex w-full items-center justify-end px-6 py-6 sm:px-8">
        <div
          role="group"
          aria-label="Language"
          className="inline-flex items-center gap-1 rounded-control border border-line bg-surface p-1 shadow-subtle"
        >
          {(['en', 'ar'] as const).map((value) => (
            <button
              key={value}
              type="button"
              lang={value}
              aria-pressed={lang === value}
              onClick={() => setLang(value)}
              className={
                lang === value
                  ? 'rounded-control bg-ink px-3 py-1 text-xs font-bold text-white transition'
                  : 'rounded-control px-3 py-1 text-xs font-bold text-ink-muted transition hover:text-ink'
              }
            >
              {value === 'en' ? 'EN' : 'العربية'}
            </button>
          ))}
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <div className="rounded-card border border-line bg-surface p-8 shadow-card-lg sm:p-10">
            <div className="mb-8 flex flex-col items-center">
              <Logo />

              <p className="mt-4 inline-flex items-center gap-1.5 rounded-pill border border-lime-tint-border bg-lime-tint px-2.5 py-0.5 text-[10px] font-bold text-lime-800">
                <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-lime" />
                {copy.portal}
              </p>
            </div>

            <div className="mb-7 text-center">
              <h1 className="text-2xl font-black tracking-tight text-ink">{copy.welcome}</h1>
              <p className="mt-1.5 text-xs text-ink-muted">{copy.subtitle}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" dir={rtl ? 'rtl' : 'ltr'}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-ink">
                  {copy.email}
                </label>
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-subtle"
                  >
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@sowtek.io"
                    className="block w-full rounded-control border border-line bg-surface py-2.5 pl-9 pr-3 text-xs text-ink transition placeholder:text-ink-subtle focus:border-ink focus:outline-none focus:ring-4 focus:ring-sky/20"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-semibold text-ink">
                    {copy.password}
                  </label>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-medium text-ink-muted transition hover:text-ink"
                  >
                    {copy.forgot}
                  </button>
                </div>
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-subtle"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={copy.password}
                    className="block w-full rounded-control border border-line bg-surface py-2.5 pl-9 pr-10 text-xs text-ink transition placeholder:text-ink-subtle focus:border-ink focus:outline-none focus:ring-4 focus:ring-sky/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-subtle transition hover:text-ink"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {notice ? (
                <p
                  role="status"
                  aria-live="polite"
                  className={
                    notice.tone === 'error'
                      ? 'flex items-start gap-2 rounded-control border border-status-danger/30 bg-status-danger-bg px-3 py-2.5 text-xs text-status-danger'
                      : 'flex items-start gap-2 rounded-control border border-status-info/30 bg-status-info-bg px-3 py-2.5 text-xs text-status-info'
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {notice.tone === 'error' ? 'error' : 'info'}
                  </span>
                  <span>{notice.message}</span>
                </p>
              ) : null}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center py-3"
                  disabled={loading}
                  aria-busy={loading}
                  icon={loading ? undefined : 'arrow_forward'}
                >
                  {loading ? copy.authenticating : copy.signIn}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="flex w-full flex-col items-center justify-between gap-2 border-t border-line bg-surface/40 px-6 py-5 text-[11px] text-ink-subtle backdrop-blur-sm sm:flex-row sm:px-8">
        <span className="font-semibold text-ink-muted">Sowtek OrderFlow</span>
        <span>Restaurant Supply Logistics OS</span>
      </footer>
    </div>
  );
}
