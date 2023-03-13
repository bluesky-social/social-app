export function extractDataUriMime(uri: string): string {
  return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'))
}

export function getDataUriSize(uri: string): number {
  return Math.round((uri.length * 3) / 4) // very rough estimate
}
