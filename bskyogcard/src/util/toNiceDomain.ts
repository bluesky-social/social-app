export const BSKY_SERVICE = 'https://bsky.social'

export function toNiceDomain(url: string): string {
  try {
    const urlp = new URL(url)
    if (`https://${urlp.host}` === BSKY_SERVICE) {
      return 'Bluesky Social'
    }
    return urlp.host ? urlp.host : url
  } catch (e) {
    return url
  }
}
