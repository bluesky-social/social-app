const SAFELINK_CHECK_TIMEOUT = 5e3

/**
 * The Safelink rule for a URL, from the same lookup that guards link taps, so
 * blocks T&S manage in Ozone apply when a link is added. Fails open: taps are
 * still checked, so a missing answer shouldn't stop someone saving.
 */
export async function checkSafelink(
  url: string,
): Promise<'block' | 'warn' | 'whitelist' | 'none'> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SAFELINK_CHECK_TIMEOUT)
  try {
    const res = await fetch(
      `https://go.bsky.app/safelink/check?u=${encodeURIComponent(url)}`,
      {signal: controller.signal},
    )
    if (!res.ok) return 'none'
    const {action} = (await res.json()) as {action?: unknown}
    return action === 'block' || action === 'warn' || action === 'whitelist'
      ? action
      : 'none'
  } catch {
    return 'none'
  } finally {
    clearTimeout(timeout)
  }
}
