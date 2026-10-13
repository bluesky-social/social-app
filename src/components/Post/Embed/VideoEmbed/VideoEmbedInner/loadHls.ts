import type Hls from 'hls.js'

let promise: Promise<typeof Hls> | undefined

/**
 * Share in-flight and successful imports, but let the video error boundary's
 * retry button start a fresh import after failure. Metro also evicts failed
 * bundle loads; retaining a rejected promise here would prevent that retry.
 */
export function loadHls(): Promise<typeof Hls> {
  if (!promise) {
    promise = import(
      // @ts-expect-error The minified build does not expose types.
      'hls.js/dist/hls.min'
    )
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      .then(mod => mod.default as typeof Hls)
      .catch(error => {
        promise = undefined
        throw error
      })
  }
  return promise
}
