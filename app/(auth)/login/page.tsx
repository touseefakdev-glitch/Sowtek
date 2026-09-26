import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOGIN_COPY, isLoginLang, type LoginLang } from '@/lib/content/login-copy';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

/**
 * Server Component. Sign-in and reset are Server Actions (see actions.ts), so
 * the browser never loads the Supabase auth SDK, and the language is a URL
 * parameter so the correct copy and document direction are rendered on the
 * server and the page still works without JavaScript.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { lang?: string };
}) {
  const lang: LoginLang = isLoginLang(searchParams.lang) ? searchParams.lang : 'en';
  const copy = LOGIN_COPY[lang];

  return (
    <div
      lang={copy.htmlLang}
      dir={copy.dir}
      className="flex min-h-screen flex-col justify-between bg-surface-sunken text-ink antialiased selection:bg-lime-tint selection:text-lime-800"
    >
      <div className="z-10 flex w-full items-center justify-end px-6 py-6 sm:px-8">
        <div
          role="group"
          aria-label={copy.languageLabel}
          className="inline-flex items-center gap-1 rounded-control border border-line bg-surface p-1 shadow-subtle"
        >
          <Link
            href="/login?lang=en"
            lang="en"
            hrefLang="en"
            aria-current={lang === 'en' ? 'true' : undefined}
            className={
              lang === 'en'
                ? 'rounded-control bg-navy px-3 py-1 text-xs font-bold text-ink-inverse'
                : 'rounded-control px-3 py-1 text-xs font-bold text-ink-muted transition-colors hover:text-ink'
            }
          >
            EN
          </Link>
          <Link
            href="/login?lang=ar"
            lang="ar"
            hrefLang="ar"
            aria-current={lang === 'ar' ? 'true' : undefined}
            className={
              lang === 'ar'
                ? 'rounded-control bg-navy px-3 py-1 text-xs font-bold text-ink-inverse'
                : 'rounded-control px-3 py-1 text-xs font-bold text-ink-muted transition-colors hover:text-ink'
            }
          >
            العربية
          </Link>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <LoginForm copy={copy} />
        </div>
      </main>

      <footer className="flex w-full flex-col items-center justify-between gap-2 border-t border-line bg-surface/40 px-6 py-5 text-xs text-ink-subtle sm:flex-row sm:px-8">
        <span className="font-semibold text-ink-muted">Sowtek OrderFlow</span>
        <span>Restaurant Supply Logistics OS</span>
      </footer>
    </div>
  );
}
