/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['variant', ['&:is(.dark *):not(:is(.dark .light *))']],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(10,122,255)',
        brandLighten: 'rgb(32,139,254)',
        textLight: 'rgb(66,87,108)',
        textDimmed: 'rgb(174,187,201)',
        dimmedBgLighten: 'rgb(30,41,54)',
        dimmedBg: 'rgb(22,30,39)',
        dimmedBgDarken: 'rgb(18,25,32)',
      },
    },
  },
  plugins: [],
}
