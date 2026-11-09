import {describe, expect, it} from '@jest/globals'

import {createLimit} from './limit'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

describe('createLimit', () => {
  it('runs at most `concurrency` tasks at once, in order', async () => {
    const limit = createLimit(2)
    const tasks = [0, 1, 2, 3, 4].map(() => deferred<number>())
    const started: number[] = []

    const results = Promise.all(
      tasks.map((task, i) =>
        limit(() => {
          started.push(i)
          return task.promise
        }),
      ),
    )

    await flush()
    expect(started).toEqual([0, 1])

    tasks[1].resolve(1)
    await flush()
    expect(started).toEqual([0, 1, 2])

    tasks[0].resolve(0)
    await flush()
    expect(started).toEqual([0, 1, 2, 3])

    tasks[2].resolve(2)
    tasks[3].resolve(3)
    await flush()
    expect(started).toEqual([0, 1, 2, 3, 4])

    tasks[4].resolve(4)
    await expect(results).resolves.toEqual([0, 1, 2, 3, 4])
  })

  it('frees the slot when a task rejects', async () => {
    const limit = createLimit(1)
    const first = deferred<string>()
    const error = new Error('failed')

    const a = limit(() => first.promise)
    const b = limit(() => Promise.resolve('b'))

    first.reject(error)
    await expect(a).rejects.toBe(error)
    await expect(b).resolves.toBe('b')
  })
})
