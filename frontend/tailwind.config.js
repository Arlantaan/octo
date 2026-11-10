/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'octopus-green': '#22c55e',
        'octopus-dark': '#0f172a',
        'octopus-light': '#f8fafc',
      },
      fontFamily: {
        'eras': ['Eras Medium ITC', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-pulse': {
          '0%': {
            textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.4)',
          },
          '100%': {
            textShadow: '0 0 15px rgba(34, 197, 94, 1), 0 0 25px rgba(34, 197, 94, 0.8), 0 0 35px rgba(34, 197, 94, 0.6)',
          },
        },
      },
    },
  },
  plugins: [],
}

