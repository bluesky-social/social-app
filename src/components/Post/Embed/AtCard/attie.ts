/** The signed-in Bluesky identity that Attie can use as a viewer hint. */
export type AttieViewer = {
  handle: string
}

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

/**
 * Adds the signed-in Bluesky user as non-authenticating Attie viewer hints.
 * Existing hint values are always replaced so a shared URL cannot identify a
 * different viewer.
 */
export function createAttieCtaUri(
  uri: string,
  viewer: AttieViewer | undefined,
): string {
  if (!isAttieUrl(uri)) return uri

  const url = new URL(uri)
  url.searchParams.delete('login_hint')
  url.searchParams.delete('viewer_did')
  url.searchParams.delete('viewer_handle')
  if (viewer) url.searchParams.set('viewer_handle', viewer.handle)
  return url.toString()
}
