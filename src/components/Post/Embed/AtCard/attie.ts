/**
 * Returns whether a URL is a public Attie site or a public Attie report.
 *
 * Attie site subdomains use `*.attie.site`. Reports use the explicit
 * `attie.ai/@handle/pages/<id>` route, so other Attie pages retain the normal
 * external-card treatment.
 */
export function isAttieUrl(uri: string | undefined): boolean {
  if (!uri) return false

  try {
    const url = new URL(uri)
    if (url.protocol !== 'https:') return false

    if (url.hostname === 'attie.site' || url.hostname.endsWith('.attie.site')) {
      return true
    }

    return (
      url.hostname === 'attie.ai' &&
      /^\/@[^/]+\/pages\/[^/]+\/?$/.test(url.pathname)
    )
  } catch {
    return false
  }
}
