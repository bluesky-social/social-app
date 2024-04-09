export function promisify<T>(request: IDBRequest<T>) {
  const promise = new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      request.removeEventListener('success', success)
      request.removeEventListener('error', error)
    }
    const success = () => {
      resolve(request.result)
      cleanup()
    }
    const error = () => {
      reject(request.error)
      cleanup()
    }
    request.addEventListener('success', success)
    request.addEventListener('error', error)
  })

  return promise
}
