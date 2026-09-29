/**
 * Normalize tester-provided post references. Accepts an `at://` URI or a
 * bsky.app profile post URL and returns an AT-URI whose authority may still
 * be a handle; the fetch path resolves handles through the real identity
 * endpoint. Anything else returns undefined - the tester never fabricates
 * record references.
 */
export function normalizePostReference({
  reference,
}: {
  reference: string
}): string | undefined {
  const trimmed = reference.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('at://')) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname !== 'bsky.app' && url.hostname !== 'staging.bsky.app') {
      return undefined
    }
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length === 4 && parts[0] === 'profile' && parts[2] === 'post') {
      return `at://${parts[1]}/app.bsky.feed.post/${parts[3]}`
    }
  } catch {}
  return undefined
}
