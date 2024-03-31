export interface AccumulateResponse<T> {
  cursor?: string
  items: T[]
}

export type AccumulateFetchFn<T> = (
  cursor: string | undefined,
) => Promise<AccumulateResponse<T>>

export async function accumulate<T>(
  fn: AccumulateFetchFn<T>,
  pageLimit = 100,
): Promise<T[]> {
  let cursor: string | undefined
  let acc: T[] = []
  for (let i = 0; i < pageLimit; i++) {
    const res = await fn(cursor)
    cursor = res.cursor
    acc = acc.concat(res.items)
    if (!cursor) {
      break
    }
  }
  return acc
}
