/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ws: {
          bg: '#0D1117',
          side: '#111827',
          editor: '#0B1220',
          panel: '#111827',
          accent: '#6366F1',
          accent2: '#8B5CF6',
          text: '#E5E7EB',
          muted: '#94A3B8',
          border: '#273244',
          hover: '#1b2535',
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
