import {logger} from '#/logger'

export async function resolveShortLink(shortLink: string) {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), 2e3)

  try {
    const res = await fetch(shortLink, {
      method: 'GET',
      signal: controller.signal,
    })
    if (res.status !== 200) {
      return shortLink
    }
    return res.url
  } catch (e: unknown) {
    logger.error('Failed to resolve short link', {safeMessage: e})
    return null
  } finally {
    clearTimeout(to)
  }
}
