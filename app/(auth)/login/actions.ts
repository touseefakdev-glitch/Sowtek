'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Sign-in and password-reset, as Server Actions.
 *
 * These used to run in the browser via the Supabase JS SDK, which meant the
 * one page a signed-out visitor sees shipped the entire auth client just to
 * submit a password. The session cookie is set server-side either way, so the
 * browser never needed it.
 */

export interface AuthFormState {
  error?: string;
  notice?: string;
  fieldErrors?: { email?: string; password?: string };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const fieldErrors: AuthFormState['fieldErrors'] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'Enter a valid work email address.';
  if (!password) fieldErrors.password = 'Enter your password.';
  if (fieldErrors.email || fieldErrors.password) return { fieldErrors };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns the same message for an unknown account and a wrong
    // password, which is what we want: do not confirm which emails exist.
    return { error: 'Those credentials were not accepted. Check them and try again.' };
  }

  // Throws, so it must sit outside the try/catch above.
  redirect('/inbox');
}

export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!EMAIL_PATTERN.test(email)) {
    return { fieldErrors: { email: 'Enter your work email address first.' } };
  }

  const origin =
    headers().get('origin') ?? headers().get('referer')?.replace(/\/login$/, '') ?? '';

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login`,
  });

  if (error) return { error: 'A reset link could not be requested. Try again shortly.' };

  // Deliberately does not confirm whether the address is registered.
  return { notice: 'If that email is registered, a password reset link has been sent.' };
}
