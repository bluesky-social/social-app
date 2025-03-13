export function toShortUrl(url: string): string {
  try {
    const urlp = new URL(url)
    if (urlp.protocol !== 'http:' && urlp.protocol !== 'https:') {
      return url
    }
    const path =
      (urlp.pathname === '/' ? '' : urlp.pathname) + urlp.search + urlp.hash
    if (path.length > 15) {
      return urlp.host + path.slice(0, 13) + '...'
    }
    return urlp.host + path
  } catch (e) {
    return url
  }
}
