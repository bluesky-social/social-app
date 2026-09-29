import {useEffect, useState} from 'react'

import {
  createListMotionState,
  isListAtRest,
  isListTrulyAtTop,
  type ListMotionEffect,
  type ListMotionEvent,
  type ListScrollPosition,
  stepListMotion,
} from './index'

/**
 * The list motion machine run against a real list: the list's signals go in,
 * the machine's timers run, and the work it says may run now is run.
 */
export type ListMotion = {
  /** For `List`'s prop of the same name. */
  onScrollGestureBegin: () => void
  /** For `List`'s prop of the same name. */
  onScrollGestureEnd: (position: ListScrollPosition) => void
  /** For `List`'s prop of the same name. */
  onScrollActivity: (position: ListScrollPosition) => void
  /** The app is about to scroll the list itself, animated. */
  beginProgrammaticScroll: () => void
  /**
   * Something was just committed above the viewport, so the list's position
   * is not to be trusted until it has taken it in.
   */
  committed: () => void
  /**
   * Runs `work` once the list is at rest, and for `atTop`, truly at the top -
   * see `isListTrulyAtTop`. Once: a request with the same id replaces this one
   * until it runs.
   */
  whenAtRest: (id: string, options: {atTop: boolean}, work: () => void) => void
  cancel: (id: string) => void
  isAtRest: () => boolean
  isTrulyAtTop: () => boolean
}

/** One list's {@link ListMotion}, the same object for the life of the list. */
export function useListMotion(): ListMotion {
  const [controller] = useState(() => createListMotionController())
  useEffect(() => controller.dispose, [controller])
  return controller
}

/**
 * The adapter behind {@link useListMotion}, with its clock and timers passed
 * in for tests.
 */
export function createListMotionController({
  now = Date.now,
  timers = {setTimeout, clearTimeout},
}: {
  now?: () => number
  timers?: {
    setTimeout: (callback: () => void, delay: number) => unknown
    clearTimeout: (handle: never) => void
  }
} = {}): ListMotion & {dispose: () => void} {
  let state = createListMotionState()
  const work = new Map<string, () => void>()
  let timer: unknown
  let programmaticTimer: unknown
  /*
   * Work can report back into the machine as it runs - a settle commits, so
   * it reports `committed` - so events that arrive while one is being handled
   * wait their turn rather than interleave with its effects.
   */
  const queue: ListMotionEvent[] = []
  let isDispatching = false

  const clear = (handle: unknown) => {
    if (handle !== undefined) timers.clearTimeout(handle as never)
  }

  const run = (effect: ListMotionEffect) => {
    switch (effect.type) {
      case 'run': {
        const fn = work.get(effect.id)
        work.delete(effect.id)
        fn?.()
        break
      }
      case 'schedule':
        clear(timer)
        timer = timers.setTimeout(() => {
          timer = undefined
          dispatch({type: 'timer'})
        }, effect.delay)
        break
      case 'cancelSchedule':
        clear(timer)
        timer = undefined
        break
      case 'scheduleProgrammaticTimeout':
        clear(programmaticTimer)
        programmaticTimer = timers.setTimeout(() => {
          programmaticTimer = undefined
          dispatch({type: 'programmaticScrollTimeout'})
        }, effect.delay)
        break
      case 'cancelProgrammaticTimeout':
        clear(programmaticTimer)
        programmaticTimer = undefined
        break
    }
  }

  const dispatch = (event: ListMotionEvent) => {
    queue.push(event)
    if (isDispatching) return
    isDispatching = true
    try {
      while (queue.length > 0) {
        const stepped = stepListMotion(state, queue.shift()!, now())
        state = stepped.state
        stepped.effects.forEach(run)
      }
    } finally {
      isDispatching = false
    }
  }

  return {
    onScrollGestureBegin: () => dispatch({type: 'gestureBegin'}),
    onScrollGestureEnd: position => dispatch({type: 'gestureEnd', position}),
    onScrollActivity: position => dispatch({type: 'scrollActivity', position}),
    beginProgrammaticScroll: () => dispatch({type: 'programmaticScrollBegin'}),
    committed: () => dispatch({type: 'committed'}),
    whenAtRest: (id, {atTop}, fn) => {
      work.set(id, fn)
      dispatch({type: 'request', request: {id, atTop}})
    },
    cancel: id => {
      work.delete(id)
      dispatch({type: 'cancel', id})
    },
    isAtRest: () => isListAtRest(state, now()),
    isTrulyAtTop: () => isListTrulyAtTop(state, now()),
    /*
     * Only the timers: the list can remount its effects (as strict mode does)
     * and go on using the same machine, which re-arms them as it needs.
     */
    dispose: () => {
      clear(timer)
      clear(programmaticTimer)
      timer = undefined
      programmaticTimer = undefined
    },
  }
}
