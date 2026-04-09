export type ColorModeValues = 'system' | 'light' | 'dark'

export function assertColorModeValues(value: string): value is ColorModeValues {
  return ['system', 'light', 'dark'].includes(value)
}

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
}

export function initSystemColorMode() {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent | MediaQueryList) => {
    applyTheme(e.matches ? 'dark' : 'light')
  }
  handler(mql)
  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}
