/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ws: {
          bg: 'rgb(var(--ws-bg) / <alpha-value>)',
          side: 'rgb(var(--ws-side) / <alpha-value>)',
          editor: 'rgb(var(--ws-editor) / <alpha-value>)',
          panel: 'rgb(var(--ws-panel) / <alpha-value>)',
          accent: 'rgb(var(--ws-accent) / <alpha-value>)',
          accent2: 'rgb(var(--ws-accent2) / <alpha-value>)',
          text: 'rgb(var(--ws-text) / <alpha-value>)',
          muted: 'rgb(var(--ws-muted) / <alpha-value>)',
          border: 'rgb(var(--ws-border) / <alpha-value>)',
          hover: 'rgb(var(--ws-hover) / <alpha-value>)',
          strong: 'rgb(var(--ws-strong) / <alpha-value>)',
          stage: 'rgb(var(--ws-stage) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
