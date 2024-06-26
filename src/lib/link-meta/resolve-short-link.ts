import {logger} from '#/logger'

export async function resolveShortLink(shortLink: string) {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), 2e3)

  try {
    const res = await fetch(shortLink, {
      method: 'GET',
      signal: controller.signal,
    })
    if (res.status !== 301) {
      return res.url
    }
    return res.headers.get('Location')
  } catch (e: unknown) {
    logger.error('Failed to resolve short link', {safeMessage: e})
    return null
  } finally {
    clearTimeout(to)
  }
}
