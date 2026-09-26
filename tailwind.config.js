/**
 * Design tokens for Sowtek OrderFlow.
 *
 * Rules enforced by convention across the app:
 *  - Colors are referenced SEMANTICALLY (bg-surface, text-ink, border-line).
 *    Never use raw palette names or arbitrary hex values in components.
 *  - Radii use a fixed vocabulary: rounded-card | rounded-control | rounded-pill.
 *  - Elevation uses: shadow-subtle (resting cards) | shadow-card (raised) |
 *    shadow-card-lg (overlays) | shadow-focus (focus rings).
 *  - Type scale is limited to the sizes in `fontSize` below.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // The fixed type scale. Anything outside this list is drift.
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }], // 12px - labels, eyebrows, metadata only
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px - table/body workhorse
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px - body copy
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px - card titles
      xl: ['1.375rem', { lineHeight: '1.75rem' }], // 22px - section headings
      '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px - page headings
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - display metrics
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        // Arabic restaurant and product names. Resolved from system fonts so
        // no extra webfont is fetched for the few fields that need it.
        arabic: ['"Noto Sans Arabic"', '"Segoe UI"', 'Tahoma', 'sans-serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Semantic surfaces and text
        canvas: '#f1f3f7',
        surface: '#ffffff',
        'surface-sunken': '#f8fafc',
        'surface-hover': '#f4f6f9',
        line: '#e2e8f0',
        'line-strong': '#cbd5e1',
        ink: '#142340',
        'ink-secondary': '#475569',
        /*
         * The three light-background text tiers are spaced so that each one
         * still clears WCAG AA (4.5:1) against `canvas` (#f1f3f7), not just
         * against white. Measured: muted 5.50:1, subtle 4.72:1 on canvas.
         * The previous values (4.28 and 2.56) failed there, and `ink-subtle` was
         * used for real 12px text in table headers, stat labels and the error
         * digest, not just for decoration.
         */
        'ink-muted': '#556377',
        'ink-subtle': '#5f6d84',
        'ink-inverse': '#ffffff',
        /*
         * Secondary text on a dark surface. Needed because darkening
         * `ink-subtle` for light backgrounds pushed the toast dismiss button
         * to 2.98:1 on `bg-ink`; this reads 7.43:1 there.
         */
        'ink-inverse-muted': '#a5b4cb',

        // Brand
        navy: {
          DEFAULT: '#142340',
          800: '#142340',
          900: '#0b1c30',
        },
        lime: {
          DEFAULT: '#70b928',
          300: '#a3d977',
          500: '#70b928',
          600: '#5a991f',
          700: '#358a22',
          800: '#2c771c',
          tint: '#eef8eb',
          'tint-border': '#d6eed0',
        },
        sky: {
          DEFAULT: '#388bfd',
          tint: '#e8f2fc',
          'tint-border': '#dbeafc',
        },

        // Semantic status palette. Domain statuses map onto THESE, never
        // onto raw hues, so a status keeps one color everywhere in the app.
        status: {
          neutral: '#64748b',
          'neutral-bg': '#f1f5f9',
          info: '#2563eb',
          'info-bg': '#eff6ff',
          success: '#15803d',
          'success-bg': '#f0fdf4',
          warning: '#b45309',
          'warning-bg': '#fffbeb',
          danger: '#b91c1c',
          'danger-bg': '#fef2f2',
        },

        whatsapp: {
          green: '#25D366',
          icon: '#25D366',
          bubble: '#edf8e7',
          inbound: '#f8fafc',
          outbound: '#edf8e7',
        },
      },
      borderRadius: {
        control: '0.75rem', // buttons, inputs, selects
        card: '1rem', // cards, panels, modals
        pill: '9999px', // badges, avatars
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(20, 35, 64, 0.04)',
        card: '0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'card-lg': '0 10px 25px -5px rgba(20, 35, 64, 0.08), 0 8px 10px -6px rgba(20, 35, 64, 0.04)',
        focus: '0 0 0 3px rgba(56, 139, 253, 0.35)',
      },
      spacing: {
        // Consistent rhythm for page gutters and grid gaps.
        gutter: '1.5rem',
        section: '1.5rem',
      },
      maxWidth: {
        content: '80rem', // 1280px - standard page content width
      },
    },
  },
  plugins: [],
};
