/**
 * Returns a function that runs at most `concurrency` tasks at once. Tasks
 * started while every slot is busy wait their turn, in the order they were
 * started.
 */
export function createLimit(concurrency: number) {
  let active = 0
  const waiting: (() => void)[] = []

  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (active < concurrency) {
      active++
    } else {
      // The task that finishes hands its slot straight to us, see below.
      await new Promise<void>(resolve => waiting.push(resolve))
    }

    try {
      return await task()
    } finally {
      /*
       * Hand the slot over without freeing it first, so a task started in the
       * meantime can't take it and push us over the limit.
       */
      const next = waiting.shift()
      if (next) {
        next()
      } else {
        active--
      }
    }
  }
}
