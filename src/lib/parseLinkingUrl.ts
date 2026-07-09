export function parseLinkingUrl(url: string): URL {
  /*
   * Hack: add a third slash to blacksky:// urls so that `URL.host` is empty and
   * `URL.pathname` has the full path.
   */
  if (url.startsWith('blacksky://') && !url.startsWith('blacksky:///')) {
    url = url.replace('blacksky://', 'blacksky:///')
  }
  return new URL(url)
}
