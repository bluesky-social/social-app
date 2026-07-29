import {AbortError} from '#/lib/async/cancelable'

export function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(new AbortError())
    }
    signal.addEventListener('abort', onAbort, {once: true})
  })
}
