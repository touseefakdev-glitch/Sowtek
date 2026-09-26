'use client';

import React, { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { Logo } from '@/components/brand/Logo';
import { requestPasswordResetAction, signInAction, type AuthFormState } from './actions';
import type { LoginCopy } from '@/lib/content/login-copy';

const INITIAL: AuthFormState = {};

function SubmitButton({ copy }: { copy: LoginCopy }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="md"
      className="w-full justify-center"
      loading={pending}
      icon={pending ? undefined : 'arrow_forward'}
    >
      {pending ? copy.authenticating : copy.signIn}
    </Button>
  );
}

export function LoginForm({ copy }: { copy: LoginCopy }) {
  const [showPassword, setShowPassword] = useState(false);

  const [signInState, signIn, signInPending] = useFormState(signInAction, INITIAL);
  const [resetState, requestReset, resetPending] = useFormState(
    requestPasswordResetAction,
    INITIAL
  );

  // Both actions post the same form; the reset action reads only `email`, so
  // submitting it never sends the password field.
  const fieldErrors = signInState.fieldErrors ?? resetState.fieldErrors;

  return (
    <div className="rounded-card border border-line bg-surface p-8 shadow-card-lg sm:p-10">
      <div className="mb-8 flex flex-col items-center">
        <Logo />
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-pill border border-lime-tint-border bg-lime-tint px-2.5 py-0.5 text-xs font-bold text-lime-800">
          <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-lime" />
          {copy.portal}
        </p>
      </div>

      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{copy.welcome}</h1>
        <p className="mt-1.5 text-sm text-ink-muted">{copy.subtitle}</p>
      </div>

      <form action={signIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-ink">
            {copy.email}
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[1.125rem] text-ink-subtle"
            >
              mail
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@sowtek.io"
              aria-invalid={fieldErrors?.email ? true : undefined}
              aria-describedby={fieldErrors?.email ? 'email-error' : undefined}
              className="block w-full rounded-control border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/35"
            />
          </div>
          {fieldErrors?.email ? (
            <p id="email-error" className="mt-1.5 text-xs font-semibold text-status-danger">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-ink">
            {copy.password}
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[1.125rem] text-ink-subtle"
            >
              lock
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder={copy.password}
              aria-invalid={fieldErrors?.password ? true : undefined}
              aria-describedby={fieldErrors?.password ? 'password-error' : undefined}
              className="block w-full rounded-control border border-line bg-surface py-2.5 pl-9 pr-10 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/35"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 end-0 flex items-center px-3 text-ink-subtle transition-colors hover:text-ink"
            >
              <span className="material-symbols-outlined text-[1.125rem]" aria-hidden>
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {fieldErrors?.password ? (
            <p id="password-error" className="mt-1.5 text-xs font-semibold text-status-danger">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {signInState.error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-control border border-status-danger/30 bg-status-danger-bg px-3 py-2.5 text-sm text-status-danger"
          >
            <span className="material-symbols-outlined text-[1.125rem]" aria-hidden>
              error
            </span>
            <span>{signInState.error}</span>
          </p>
        ) : null}

        {resetState.notice ? (
          <p
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 rounded-control border border-status-info/30 bg-status-info-bg px-3 py-2.5 text-sm text-status-info"
          >
            <span className="material-symbols-outlined text-[1.125rem]" aria-hidden>
              info
            </span>
            <span>{resetState.notice}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="submit"
            formAction={requestReset}
            disabled={resetPending || signInPending}
            className="text-xs font-semibold text-ink-muted underline underline-offset-2 transition-colors hover:text-ink disabled:opacity-60"
          >
            {copy.forgot}
          </button>
        </div>

        <div className="pt-1">
          <SubmitButton copy={copy} />
        </div>
      </form>
    </div>
  );
}
