/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(10,122,255)',
        textLight: 'rgb(66,87,108)',
      },
    },
  },
  plugins: [],
}
