/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0f',
          1: '#12121a',
          2: '#1a1a25',
          3: '#222230',
          4: '#2a2a3a',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: '#4f46e5',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
