/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        textLight: 'rgb(66,87,108)',
      },
    },
  },
  plugins: [],
}
