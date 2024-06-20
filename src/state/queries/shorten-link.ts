import {logger} from '#/logger'

export function useShortenLink() {
  return async (inputUrl: string): Promise<{url: string}> => {
    const url = new URL(inputUrl)
    const res = await fetch('https://go.bsky.app/link', {
      method: 'POST',
      body: JSON.stringify({
        path: url.pathname,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      logger.error('Failed to shorten link', {safeMessage: res.status})
      return {url: inputUrl}
    }

    return res.json()
  }
}
