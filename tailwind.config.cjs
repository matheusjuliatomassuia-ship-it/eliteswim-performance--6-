/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './constants/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        surface: '#0f172a',
        primary: '#0ea5e9',
        primaryDark: '#0369a1',
        accent: '#f2ff00',
        danger: '#f43f5e',
        success: '#10b981',
        accentGlow: '#00f2ff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
}