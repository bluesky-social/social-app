// \u2705 = ✅
// \u2713 = ✓
// \u2714 = ✔
// \u2611 = ☑
const CHECK_MARKS_RE = /[\u2705\u2713\u2714\u2611]/gu

export function sanitizeDisplayName(str: string): string {
  if (typeof str === 'string') {
    return str.replace(CHECK_MARKS_RE, '')
  }
  return ''
}
