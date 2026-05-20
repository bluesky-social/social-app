/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['variant', ['&:is(.dark *):not(:is(.dark .light *))']],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(0,106,255)',
        brandHover: 'rgb(245,249,255)',
        brandHoverDark: 'rgb(17,24,34)',
        brandLighten: 'rgb(32,139,254)',
        textLight: 'rgb(63,82,104)',
        textDimmed: 'rgb(164,179,197)',
        textNeutral: 'rgb(102,123,153)',
        dimmedBgLighten: 'rgb(30,41,54)',
        dimmedBg: 'rgb(22,30,39)',
        dimmedBgDarken: 'rgb(18,25,32)',
      },
    },
  },
  plugins: [],
}
