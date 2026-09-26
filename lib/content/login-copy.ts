/**
 * Bilingual login copy.
 *
 * Lives outside the client component so the page can render the correct
 * language on the server. The language toggle is a link, not a stateful button,
 * so the page works without JavaScript and the document direction is set on the
 * server rather than on the <form> alone, which left the surrounding chrome
 * left-to-right while the form itself was right-to-left.
 */

export const LOGIN_COPY = {
  en: {
    htmlLang: 'en',
    dir: 'ltr' as const,
    welcome: 'Welcome back',
    subtitle: 'Sign in with your agent credentials to access the Unified Inbox',
    email: 'Work Email Address',
    password: 'Password',
    forgot: 'Forgot password?',
    signIn: 'Sign in to OrderFlow',
    authenticating: 'Authenticating...',
    portal: 'B2B Restaurant Supplier Portal',
    languageLabel: 'Language',
  },
  ar: {
    htmlLang: 'ar',
    dir: 'rtl' as const,
    welcome: 'أهلاً بعودتك',
    subtitle: 'سجّل الدخول ببيانات الوكيل للوصول إلى صندوق الوارد الموحّد',
    email: 'البريد الإلكتروني للعمل',
    password: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    signIn: 'تسجيل الدخول إلى OrderFlow',
    authenticating: 'جارٍ التحقق...',
    portal: 'بوابة الموردين للمطاعم',
    languageLabel: 'اللغة',
  },
} as const;

export type LoginLang = keyof typeof LOGIN_COPY;
export type LoginCopy = (typeof LOGIN_COPY)[LoginLang];

export function isLoginLang(value: string | undefined): value is LoginLang {
  return value === 'ar' || value === 'en';
}
