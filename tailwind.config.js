/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0A0A0F',
          surface: '#111118',
          elevated: '#1A1A26',
        },
        border: {
          subtle: '#2A2A3A',
        },
        accent: {
          primary: '#6C63FF',
          secondary: '#00D4AA',
          danger: '#FF4F4F',
          gold: '#FFB800',
        },
        text: {
          primary: '#F0F0FF',
          secondary: '#8888AA',
          muted: '#55556A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'input': '8px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
