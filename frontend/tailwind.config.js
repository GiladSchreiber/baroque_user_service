/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: 'var(--gold)',
          light:   'var(--gold-light)',
          dark:    'var(--gold-dark)',
        },
        baroque: {
          bg:      'var(--baroque-bg)',
          surface: 'var(--baroque-surface)',
          border:  'var(--baroque-border)',
          text:    'var(--baroque-text)',
          muted:   'var(--baroque-muted)',
        },
      },
      fontFamily: {
        serif: ['Assistant', 'system-ui', 'sans-serif'],
        sans:  ['Assistant', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
