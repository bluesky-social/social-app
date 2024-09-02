export function cancelable<A, T>(
  f: (args: A) => Promise<T>,
  signal: AbortSignal,
) {
  return (args: A) => {
    return new Promise<T>((resolve, reject) => {
      signal.addEventListener('abort', () => {
        reject(new AbortError())
      })
      f(args).then(resolve, reject)
    })
  }
}

export class AbortError extends Error {
  constructor() {
    super('Aborted')
    this.name = 'AbortError'
  }
}
