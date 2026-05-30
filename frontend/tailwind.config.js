/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F172A',
        panel: '#111827',
        primary: '#2563EB',
        accent: '#F97316',
        ok: '#16A34A',
        critical: '#DC2626'
      },
      boxShadow: {
        panel: '0 10px 30px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: []
};

