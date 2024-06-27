import {logger} from '#/logger'
import {startUriToStarterPackUri} from 'lib/strings/starter-pack'

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
    return startUriToStarterPackUri(res.url)
  } catch (e: unknown) {
    logger.error('Failed to resolve short link', {safeMessage: e})
    return null
  } finally {
    clearTimeout(to)
  }
}
