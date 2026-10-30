import {AbortError} from '#/lib/async/cancelable'

/**
 * Runs at most `max` tasks at once, in FIFO order. A task queued when its
 * signal aborts is removed and never runs. A running task keeps its slot
 * until its promise settles, because the work it wraps may not be abortable.
 */
export function createConcurrencyLimit({max}: {max: number}) {
  /** Starters for queued tasks, oldest first. */
  const queue: Array<() => void> = []
  let running = 0

  function drain() {
    while (running < max) {
      const start = queue.shift()
      if (!start) return
      running++
      start()
    }
  }

  return function runLimited<T>({
    task,
    signal,
  }: {
    task: () => Promise<T>
    signal: AbortSignal
  }): Promise<T> {
    if (signal.aborted) return Promise.reject(new AbortError())
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        queue.splice(queue.indexOf(start), 1)
        reject(new AbortError())
      }
      const release = () => {
        running--
        drain()
      }
      /* Only called with a slot already counted in `running`. */
      const start = () => {
        signal.removeEventListener('abort', onAbort)
        /* The async wrapper turns a synchronous throw into a rejection. */
        const result = (async () => task())()
        resolve(result)
        void result.then(release, release)
      }
      signal.addEventListener('abort', onAbort, {once: true})
      queue.push(start)
      drain()
    })
  }
}
