export async function wait<T>(delay: number, fn: T): Promise<Awaited<T>> {
  return await Promise.all([fn, new Promise(y => setTimeout(y, delay))]).then(
    arr => arr[0],
  )
}
