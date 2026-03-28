/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      colors: {
        surface: {
          0: '#08080c',
          1: '#101018',
          2: '#181824',
          3: '#20202e',
          4: '#2a2a3c',
          5: '#34344a',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: '#4f46e5',
          subtle: '#6366f1',
        },
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
      },
      boxShadow: {
        'glow-sm': '0 0 12px -2px rgba(99, 102, 241, 0.2)',
        'glow': '0 0 20px -4px rgba(99, 102, 241, 0.25)',
        'glow-lg': '0 0 32px -4px rgba(99, 102, 241, 0.3)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'inset-top': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', maxHeight: '0' },
          to: { opacity: '1', maxHeight: '500px' },
        },
        'progress-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'progress-glow': 'progress-glow 2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
