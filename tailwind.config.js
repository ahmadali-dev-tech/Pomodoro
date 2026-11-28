export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        'accent-soft': 'var(--accent-soft)',
        success: 'var(--success)',
        'success-soft': 'var(--success-soft)',
        warning: 'var(--warning)',
        'warning-soft': 'var(--warning-soft)',
        danger: 'var(--danger)',
        'danger-fg': 'var(--danger-fg)',
        'danger-soft': 'var(--danger-soft)',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Hanken Grotesk Variable"', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: { pop: 'var(--pop-shadow)' },
    },
  },
  plugins: [],
}
