/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#142340',
          'navy-dark': '#0b1c30',
          lime: '#70b928',
          'lime-light': '#eef8eb',
          'lime-border': '#d6eed0',
          sky: '#388bfd',
          card: '#ffffff',
          canvas: '#f1f3f7',
        },
        navy: {
          DEFAULT: '#142340',
          50: '#f0f4fc',
          100: '#dce5f8',
          800: '#142340',
          900: '#0b1c30',
        },
        lime: {
          DEFAULT: '#70b928',
          50: '#f2faed',
          100: '#eef8eb',
          200: '#d6eed0',
          500: '#70b928',
          600: '#5a991f',
          700: '#2c771c',
        },
        whatsapp: {
          light: '#e2f7cb',
          bubble: '#edf8e7',
          inbound: '#f8fafc',
          outbound: '#edf8e7',
          icon: '#25D366',
          green: '#25D366',
        },
        canvas: '#f1f3f7',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
        'card-lg': '0 10px 25px -5px rgba(20, 35, 64, 0.05), 0 8px 10px -6px rgba(20, 35, 64, 0.03)',
        subtle: '0 1px 3px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
