import {describe, expect, jest, test} from '@jest/globals'

import {AbortError} from '#/lib/async/cancelable'
import {flush} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {createConcurrencyLimit} from '#/components/ComposerV2/store/utils/createConcurrencyLimit'

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

/** A task the test settles by hand, recording when it starts. */
function manualTask(name: string, started: string[]) {
  const gate = deferred<string>()
  return {
    ...gate,
    task: () => {
      started.push(name)
      return gate.promise
    },
  }
}

describe('createConcurrencyLimit', () => {
  test('runs at most max tasks at once, in FIFO order', async () => {
    const limit = createConcurrencyLimit({max: 1})
    const {signal} = new AbortController()
    const started: string[] = []
    const a = manualTask('a', started)
    const b = manualTask('b', started)
    const c = manualTask('c', started)

    const results = [a, b, c].map(({task}) => limit({task, signal}))
    await flush()
    expect(started).toEqual(['a'])

    a.resolve('A')
    await flush()
    expect(started).toEqual(['a', 'b'])

    b.resolve('B')
    await flush()
    expect(started).toEqual(['a', 'b', 'c'])

    c.resolve('C')
    await expect(Promise.all(results)).resolves.toEqual(['A', 'B', 'C'])
  })

  test('allows max tasks to run together', async () => {
    const limit = createConcurrencyLimit({max: 2})
    const {signal} = new AbortController()
    const started: string[] = []
    const [a, b, c] = ['a', 'b', 'c'].map(name => manualTask(name, started))

    void limit({task: a.task, signal})
    void limit({task: b.task, signal})
    void limit({task: c.task, signal})
    await flush()
    expect(started).toEqual(['a', 'b'])

    b.resolve('B')
    await flush()
    expect(started).toEqual(['a', 'b', 'c'])
  })

  test('an already-aborted signal rejects without queuing', async () => {
    const limit = createConcurrencyLimit({max: 1})
    const controller = new AbortController()
    controller.abort()
    const task = jest.fn(() => Promise.resolve('never'))

    await expect(limit({task, signal: controller.signal})).rejects.toThrow(
      AbortError,
    )
    expect(task).not.toHaveBeenCalled()

    /* The slot was never taken. */
    const live = new AbortController()
    await expect(
      limit({task: () => Promise.resolve('ok'), signal: live.signal}),
    ).resolves.toBe('ok')
  })

  test('aborting while queued removes the entry; later entries still run', async () => {
    const limit = createConcurrencyLimit({max: 1})
    const {signal} = new AbortController()
    const queued = new AbortController()
    const started: string[] = []
    const a = manualTask('a', started)
    const b = manualTask('b', started)
    const c = manualTask('c', started)

    const first = limit({task: a.task, signal})
    const second = limit({task: b.task, signal: queued.signal})
    const third = limit({task: c.task, signal})
    queued.abort()
    await expect(second).rejects.toThrow(AbortError)

    a.resolve('A')
    await expect(first).resolves.toBe('A')
    await flush()
    expect(started).toEqual(['a', 'c'])

    c.resolve('C')
    await expect(third).resolves.toBe('C')
  })

  test('aborting while running keeps the slot until the task settles', async () => {
    const limit = createConcurrencyLimit({max: 1})
    const running = new AbortController()
    const {signal} = new AbortController()
    const started: string[] = []
    const a = manualTask('a', started)
    const b = manualTask('b', started)

    const first = limit({task: a.task, signal: running.signal})
    void limit({task: b.task, signal})
    await flush()

    running.abort()
    await flush()
    expect(started).toEqual(['a'])

    /* The task's own result is passed through; the limiter does not cancel it. */
    a.resolve('A')
    await expect(first).resolves.toBe('A')
    await flush()
    expect(started).toEqual(['a', 'b'])
  })

  test('a rejection releases the slot', async () => {
    const limit = createConcurrencyLimit({max: 1})
    const {signal} = new AbortController()
    const started: string[] = []
    const a = manualTask('a', started)
    const b = manualTask('b', started)

    const first = limit({task: a.task, signal})
    void limit({task: b.task, signal})
    a.reject(new Error('boom'))

    await expect(first).rejects.toThrow('boom')
    await flush()
    expect(started).toEqual(['a', 'b'])
  })

  test('a synchronous throw rejects and releases the slot', async () => {
    const limit = createConcurrencyLimit({max: 1})
    const {signal} = new AbortController()

    await expect(
      limit({
        task: () => {
          throw new Error('sync')
        },
        signal,
      }),
    ).rejects.toThrow('sync')
    await expect(
      limit({task: () => Promise.resolve('next'), signal}),
    ).resolves.toBe('next')
  })

  test('detaches the abort listener once a task starts or settles', async () => {
    const limit = createConcurrencyLimit({max: 1})
    const controller = new AbortController()
    const remove = jest.spyOn(controller.signal, 'removeEventListener')

    await limit({task: () => Promise.resolve(), signal: controller.signal})

    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  })
})
