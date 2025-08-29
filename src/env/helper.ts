/**
 * Validates a proxy header is valid if supplied
 */
export const isValidProxyHeaderOrThrow = (val: string) => {
  if (!val) {
    return
  }

  if (!val.startsWith('did:')) {
    throw new Error(
      'Configured proxy header is invalid. Does not start with `did:`',
    )
  }

  const pts = val.split('#')
  if (pts.length !== 2) {
    throw new Error(
      'Configured proxy header is invalid. Does not contain a single `#`',
    )
  }

  if (pts[1].length < 1) {
    throw new Error(
      'Configured proxy header is invalid. Does not contain a valid service after the `#`',
    )
  }
}
