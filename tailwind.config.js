/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#121212',
          800: '#18181B',
          700: '#222226',
          600: '#2D2D32',
          500: '#3F3F46',
        },
        gold: {
          300: '#F3E5AB',
          400: '#E5C158',
          500: '#D4AF37',
          600: '#AA771C',
          700: '#8C5E14',
        },
        status: {
          waiting: '#F59E0B',
          serving: '#10B981',
          completed: '#64748B',
          cancelled: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
