/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        volt: {
          green: '#2ECC71',
          'green-dark': '#27AE60',
          'green-light': '#e8faf0',
          'green-bg': '#f0faf5',
          orange: '#F39C12',
          'orange-light': '#fef3e2',
        },
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
