export function isNetworkError(e: unknown) {
  const str = String(e)
  return str.includes('Aborted') || str.includes('Network request failed')
}
