/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['variant', ['&:is(.dark *):not(:is(.dark .light *))']],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        brandHover: 'var(--brandHover)',
        brandHoverDark: 'var(--brandHoverDark)',
        brandLighten: 'var(--brandLighten)',
        textLight: 'var(--textLight)',
        textDimmed: 'var(--textDimmed)',
        textNeutral: 'var(--textNeutral)',
        dimmedBgLighten: 'var(--dimmedBgLighten)',
        dimmedBg: 'var(--dimmedBg)',
        dimmedBgDarken: 'var(--dimmedBgDarken)',
      },
    },
  },
  plugins: [],
}
