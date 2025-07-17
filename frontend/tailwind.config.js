/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hack: {
          bg: '#17171d',
          surface: '#1f1f23',
          border: '#33353f',
          text: '#f7fafc',
          textSecondary: '#a0aec0',
          primary: '#ec3750',
          primaryHover: '#e53e3e',
          secondary: '#ff8c37',
          accent: '#5d7aff',
          accentHover: '#4c63d2',
          success: '#33d9b2',
          warning: '#ffb142',
          error: '#ff6b6b',
          pink: '#ff79c6',
          purple: '#bd93f9',
          cyan: '#8be9fd',
          green: '#50fa7b',
          yellow: '#f1fa8c',
          orange: '#ffb86c',
        },
      },
      fontFamily: {
        'mono': ['Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '13': '3.25rem',
        '18': '4.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px #ec3750' },
          '100%': { boxShadow: '0 0 30px #ec3750, 0 0 40px #ec3750' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'hack': '0 0 20px rgba(236, 55, 80, 0.3)',
        'hack-lg': '0 0 40px rgba(236, 55, 80, 0.4)',
      },
    },
  },
  plugins: [],
};
