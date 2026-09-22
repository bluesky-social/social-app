export function parseLinkingUrl(url: string): URL {
  /*
   * Add a third slash to app-scheme URLs so that `URL.host` is empty and
   * `URL.pathname` has the full path.
   */
  url = url.replace(/^(bluesky|bsky):\/\/(?!\/)/i, '$1:///')
  return new URL(url)
}
