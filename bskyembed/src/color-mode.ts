export type ColorModeValues = 'system' | 'light' | 'dark'

export function assertColorModeValues(value: string): value is ColorModeValues {
  return ['system', 'light', 'dark'].includes(value)
}

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
}

export function initSystemColorMode() {
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
