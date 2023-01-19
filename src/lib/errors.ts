export function isNetworkError(e: unknown) {
  const str = String(e)
  return str.includes('Abort') || str.includes('Network request failed')
}
