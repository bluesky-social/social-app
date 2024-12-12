export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
}

export function initColorMode() {
  applyTheme(
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  )
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', mql => {
      applyTheme(mql.matches ? 'dark' : 'light')
    })
}
