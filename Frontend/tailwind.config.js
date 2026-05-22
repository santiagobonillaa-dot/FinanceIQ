/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    fontFamily: {
      sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        night: {
          50: '#f5f7ff',
          100: '#e9ecff',
          200: '#c8d2ff',
          300: '#97a6ff',
          400: '#6177ff',
          500: '#4a5dff',
          600: '#3340d9',
          700: '#1f2aa8',
          800: '#121b73',
          900: '#0a1147',
          950: '#050824',
        },
        brand: {
          primary: '#0066ff',
          secondary: '#00d897',
          accent: '#ffd700',
        },
        surface: {
          100: '#0a0e1a',
          200: '#0d1321',
          300: '#141824',
          400: '#1a1f2e',
        },
      },
      boxShadow: {
        glow: '0 0 60px rgba(0, 102, 255, 0.25)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top, rgba(0,102,255,0.35), transparent 60%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(20,24,36,0.95), rgba(26,31,46,0.65))',
      },
    },
  },
  plugins: [],
};

