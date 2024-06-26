import {logger} from '#/logger'

export function useResolveShortLink() {
  return async (shortLink: string) => {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), 2e3)

    try {
      const res = await fetch(
        shortLink,
        {method: 'HEAD', redirect: 'manual'},
        {signal: controller.signal},
      )
      if (res.status !== 301) {
        return shortLink
      }
      return res.headers.get('Location')
    } catch (e: unknown) {
      logger.error('Failed to resolve short link', {safeMessage: e})
    } finally {
      clearTimeout(to)
    }
  }
}
