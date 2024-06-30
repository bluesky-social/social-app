import {logger} from '#/logger'

export async function resolveShortLink(shortLink: string) {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), 2e3)

  try {
    const res = await fetch(shortLink, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
    if (res.status !== 200) {
      logger.error('Failed to resolve short link', {status: res.status})
      return shortLink
    }
    const json = (await res.json()) as {url: string}
    return json.url
  } catch (e: unknown) {
    logger.error('Failed to resolve short link', {safeMessage: e})
    return shortLink
  } finally {
    clearTimeout(to)
  }
}
