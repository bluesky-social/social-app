export function parseLinkingUrl(url: string): URL {
  /*
   * Hack: add a third slash to bluesky:// urls so that `URL.host` is empty and
   * `URL.pathname` has the full path.
   */
  if (url.startsWith('bluesky://') && !url.startsWith('bluesky:///')) {
    url = url.replace('bluesky://', 'bluesky:///')
  }
  return new URL(url)
}
