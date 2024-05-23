export function cleanError(str: any): string {
  if (!str) {
    return ''
  }
  if (typeof str !== 'string') {
    str = str.toString()
  }
  if (isNetworkError(str)) {
    return 'Unable to connect. Please check your internet connection and try again.'
  }
  if (str.includes('Upstream Failure')) {
    return 'The server appears to be experiencing issues. Please try again in a few moments.'
  }
  if (str.includes('Bad token scope')) {
    return 'This feature is not available while using an App Password. Please sign in with your main password.'
  }
  if (str.startsWith('Error: ')) {
    return str.slice('Error: '.length)
  }
  return str
}

export function isNetworkError(e: unknown) {
  const str = String(e)
  return (
    str.includes('Abort') ||
    str.includes('Network request failed') ||
    str.includes('Failed to fetch')
  )
}
