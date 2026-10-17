/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        'surface-hover': 'var(--bg-surface-hover)',
        subtle: 'var(--border-subtle)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-fg': 'var(--accent-fg)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
        accent: 'var(--accent)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
      },
    },
  },
  plugins: [],
};
