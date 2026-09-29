import {
  createListMotionState,
  isListAtRest,
  isListTrulyAtTop,
  LIST_COMMIT_CORRECTION_TIMEOUT_MS,
  LIST_PROGRAMMATIC_SCROLL_TIMEOUT_MS,
  LIST_QUIET_PERIOD_MS,
  type ListMotionEffect,
  type ListMotionEvent,
  type ListMotionState,
  stepListMotion,
} from './index'
import {createListMotionController} from './useListMotion'

const TOP = {offsetY: 0, contentHeight: 5000}
const DOWN = {offsetY: 2104, contentHeight: 7104}

/** Steps a machine through events, keeping the effects of each. */
function machine() {
  let state: ListMotionState = createListMotionState()
  let now = 1000
  const log: ListMotionEffect[][] = []
  const step = (event: ListMotionEvent, at = now) => {
    now = at
    const stepped = stepListMotion(state, event, now)
    state = stepped.state
    log.push(stepped.effects)
    return stepped.effects
  }
  return {
    step,
    at: (time: number) => (now = time),
    get now() {
      return now
    },
    get state() {
      return state
    },
    ranIds: () =>
      log.flat().flatMap(effect => (effect.type === 'run' ? [effect.id] : [])),
  }
}

const requestTop = {
  type: 'request',
  request: {id: 'top', atTop: true},
} as const
const requestRest = {
  type: 'request',
  request: {id: 'rest', atTop: false},
} as const

/** A drag that comes to rest where it ends. */
function drag(m: ReturnType<typeof machine>, to: typeof TOP, at: number) {
  m.step({type: 'gestureBegin'}, at)
  m.step({type: 'scrollActivity', position: to}, at + 10)
  m.step({type: 'gestureEnd', position: to}, at + 20)
}

describe('list motion on mount', () => {
  it('does not know where the list is until it has been moved', () => {
    const m = machine()
    expect(isListAtRest(m.state, m.now)).toBe(true)
    expect(isListTrulyAtTop(m.state, m.now)).toBe(false)

    m.step(requestTop)
    // The resting offset iOS applies after mount, which is where it was put.
    m.step({type: 'scrollActivity', position: TOP}, 1100)

    expect(m.ranIds()).toEqual([])
    expect(isListTrulyAtTop(m.state, m.now)).toBe(false)
  })

  it('runs work that only needs rest at once', () => {
    const m = machine()
    expect(m.step(requestRest)).toContainEqual({type: 'run', id: 'rest'})
  })

  it('runs top work once the list has been moved to the top', () => {
    const m = machine()
    m.step(requestTop)
    drag(m, TOP, 2000)
    expect(m.ranIds()).toEqual(['top'])
  })
})

describe('list motion under a gesture', () => {
  it('waits for the gesture to end, even at the top', () => {
    const m = machine()
    m.step(requestTop)
    m.step({type: 'gestureBegin'}, 2000)
    m.step({type: 'scrollActivity', position: TOP}, 2010)
    expect(m.ranIds()).toEqual([])
    expect(isListAtRest(m.state, m.now)).toBe(false)

    m.step({type: 'gestureEnd', position: TOP}, 2020)
    expect(m.ranIds()).toEqual(['top'])
  })

  it('waits through the momentum, which the list reports as the end', () => {
    const m = machine()
    m.step(requestTop)
    m.step({type: 'gestureBegin'}, 2000)
    // Released with velocity: the list reports no end until momentum ends.
    for (let at = 2010; at < 2600; at += 16) {
      m.step({type: 'scrollActivity', position: {...TOP, offsetY: 3}}, at)
    }
    expect(m.ranIds()).toEqual([])
    m.step({type: 'gestureEnd', position: TOP}, 2600)
    expect(m.ranIds()).toEqual(['top'])
  })

  it('keeps top work waiting while the list rests below the top', () => {
    const m = machine()
    m.step(requestTop)
    drag(m, DOWN, 2000)
    expect(m.ranIds()).toEqual([])
    expect(m.state.requests).toEqual([{id: 'top', atTop: true}])

    drag(m, TOP, 3000)
    expect(m.ranIds()).toEqual(['top'])
    expect(m.state.requests).toEqual([])
  })

  it('runs rest work at the end of a gesture wherever it ends', () => {
    const m = machine()
    m.step({type: 'gestureBegin'}, 2000)
    m.step(requestRest, 2005)
    m.step(requestTop, 2006)
    expect(m.ranIds()).toEqual([])
    m.step({type: 'gestureEnd', position: DOWN}, 2020)
    expect(m.ranIds()).toEqual(['rest'])
  })
})

describe('list motion after a commit above the viewport', () => {
  /** At rest at the top, having been moved there. */
  function atTop() {
    const m = machine()
    drag(m, TOP, 2000)
    return m
  }

  it('does not trust a top from before the correction', () => {
    const m = atTop()
    m.step({type: 'committed'}, 3000)
    // Asked for as the commit lands, with the position still reading the top.
    expect(m.step(requestTop, 3030)).toEqual([
      {type: 'schedule', delay: LIST_COMMIT_CORRECTION_TIMEOUT_MS - 30},
    ])
    expect(isListTrulyAtTop(m.state, m.now)).toBe(false)
    // The correction moves the list down, off the top.
    m.step({type: 'scrollActivity', position: DOWN}, 3055)
    m.step({type: 'timer'}, 3055 + LIST_QUIET_PERIOD_MS)

    expect(m.ranIds()).toEqual([])
    expect(isListTrulyAtTop(m.state, m.now)).toBe(false)
  })

  it('does not take a touch that lands and lifts for the correction', () => {
    const m = atTop()
    m.step({type: 'committed'}, 3000)
    m.step(requestTop, 3001)
    // A drag that ends without the list dispatching anything.
    m.step({type: 'gestureBegin'}, 3010)
    m.step({type: 'gestureEnd', position: TOP}, 3020)

    expect(m.ranIds()).toEqual([])
    expect(isListAtRest(m.state, m.now)).toBe(false)
  })

  it('waits for the list to be quiet after the correction', () => {
    const m = atTop()
    m.step({type: 'committed'}, 3000)
    m.step(requestTop, 3001)
    // The correction and the re-measuring after it, which end at the top.
    m.step({type: 'scrollActivity', position: {...TOP, offsetY: 40}}, 3050)
    m.step({type: 'scrollActivity', position: TOP}, 3120)
    m.step({type: 'timer'}, 3050 + LIST_QUIET_PERIOD_MS)
    expect(m.ranIds()).toEqual([])

    m.step({type: 'timer'}, 3120 + LIST_QUIET_PERIOD_MS)
    expect(m.ranIds()).toEqual(['top'])
  })

  it('trusts the position again once a commit that moved nothing times out', () => {
    const m = atTop()
    m.step({type: 'committed'}, 3000)
    m.step(requestTop, 3001)
    m.step({type: 'timer'}, 3000 + LIST_COMMIT_CORRECTION_TIMEOUT_MS)
    expect(m.ranIds()).toEqual(['top'])
  })

  it('asks for the timer again when activity pushes the wait out', () => {
    const m = atTop()
    m.step({type: 'committed'}, 3000)
    m.step(requestTop, 3001)
    expect(
      m.step({type: 'scrollActivity', position: TOP}, 3100),
    ).toContainEqual({type: 'schedule', delay: LIST_QUIET_PERIOD_MS})
  })

  it('has nothing left to wait for once the wait has been served', () => {
    const m = atTop()
    m.step({type: 'committed'}, 3000)
    m.step(requestRest, 3001)
    m.step({type: 'timer'}, 3000 + LIST_COMMIT_CORRECTION_TIMEOUT_MS)
    expect(m.state.committedAt).toBeUndefined()
    expect(m.step(requestTop, 4000)).toContainEqual({type: 'run', id: 'top'})
  })
})

describe('list motion under a scroll the app started', () => {
  it('counts the scroll as motion until the list reports its end', () => {
    const m = machine()
    m.step(requestTop)
    drag(m, DOWN, 2000)
    expect(m.step({type: 'programmaticScrollBegin'}, 3000)).toEqual([
      {
        type: 'scheduleProgrammaticTimeout',
        delay: LIST_PROGRAMMATIC_SCROLL_TIMEOUT_MS,
      },
    ])
    m.step({type: 'scrollActivity', position: TOP}, 3200)
    expect(m.ranIds()).toEqual([])

    // iOS reports the end of the animation as the end of momentum.
    const effects = m.step({type: 'gestureEnd', position: TOP}, 3300)
    expect(effects).toContainEqual({type: 'cancelProgrammaticTimeout'})
    expect(m.ranIds()).toEqual(['top'])
  })

  it('ends the scroll when its fallback timer runs out', () => {
    const m = machine()
    drag(m, DOWN, 2000)
    m.step({type: 'programmaticScrollBegin'}, 3000)
    m.step({type: 'scrollActivity', position: TOP}, 3200)
    m.step(requestTop, 3300)
    expect(m.ranIds()).toEqual([])

    m.step({type: 'programmaticScrollTimeout'}, 4000)
    expect(m.ranIds()).toEqual(['top'])
  })

  it('counts a scroll to the top as arriving there, even from mount', () => {
    const m = machine()
    m.step({type: 'scrollActivity', position: TOP}, 1100)
    m.step({type: 'programmaticScrollBegin'}, 2000)
    m.step(requestTop, 2001)
    // Already where it was asked to go, so nothing reports its end.
    m.step({type: 'programmaticScrollTimeout'}, 3000)
    expect(m.ranIds()).toEqual(['top'])
  })

  it('still needs a position to be at the top', () => {
    const m = machine()
    m.step({type: 'programmaticScrollBegin'}, 2000)
    m.step(requestTop, 2001)
    m.step({type: 'programmaticScrollTimeout'}, 3000)
    expect(m.ranIds()).toEqual([])
  })
})

describe('list motion requests', () => {
  it('replaces a waiting request with the same id', () => {
    const m = machine()
    m.step(requestTop)
    // Now only needing rest, which the list is at.
    m.step({type: 'request', request: {id: 'top', atTop: false}})
    expect(m.ranIds()).toEqual(['top'])
    expect(m.state.requests).toEqual([])
  })

  it('forgets a cancelled request', () => {
    const m = machine()
    m.step(requestTop)
    m.step({type: 'cancel', id: 'top'})
    drag(m, TOP, 2000)
    expect(m.ranIds()).toEqual([])
  })
})

describe('createListMotionController', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  function controller() {
    return createListMotionController({now: () => Date.now()})
  }

  it('runs work when its timer says it may', () => {
    const motion = controller()
    motion.onScrollGestureBegin()
    motion.onScrollActivity(TOP)
    motion.onScrollGestureEnd(TOP)
    motion.committed()
    const work = jest.fn()

    motion.whenAtRest('top', {atTop: true}, work)
    expect(work).not.toHaveBeenCalled()
    jest.advanceTimersByTime(LIST_COMMIT_CORRECTION_TIMEOUT_MS)

    expect(work).toHaveBeenCalledTimes(1)
    expect(motion.isTrulyAtTop()).toBe(true)
  })

  it('lets work report back into the machine as it runs', () => {
    const motion = controller()
    motion.onScrollGestureBegin()
    motion.onScrollGestureEnd(TOP)
    const later = jest.fn()
    motion.whenAtRest('first', {atTop: true}, () => {
      // A settle commits, and asks to be followed up.
      motion.committed()
      motion.whenAtRest('later', {atTop: true}, later)
    })

    expect(later).not.toHaveBeenCalled()
    expect(motion.isAtRest()).toBe(false)
    jest.advanceTimersByTime(LIST_COMMIT_CORRECTION_TIMEOUT_MS)
    expect(later).toHaveBeenCalledTimes(1)
  })

  it('ends a programmatic scroll on its own', () => {
    const motion = controller()
    motion.onScrollActivity(TOP)
    motion.beginProgrammaticScroll()
    const work = jest.fn()
    motion.whenAtRest('top', {atTop: true}, work)
    expect(motion.isAtRest()).toBe(false)

    jest.advanceTimersByTime(LIST_PROGRAMMATIC_SCROLL_TIMEOUT_MS)

    expect(work).toHaveBeenCalledTimes(1)
  })

  it('runs nothing once cancelled or disposed', () => {
    const motion = controller()
    motion.onScrollGestureBegin()
    motion.onScrollGestureEnd(TOP)
    motion.committed()
    const cancelled = jest.fn()
    const disposed = jest.fn()
    motion.whenAtRest('cancelled', {atTop: true}, cancelled)
    motion.whenAtRest('disposed', {atTop: true}, disposed)

    motion.cancel('cancelled')
    motion.dispose()
    jest.advanceTimersByTime(LIST_COMMIT_CORRECTION_TIMEOUT_MS)

    expect(cancelled).not.toHaveBeenCalled()
    expect(disposed).not.toHaveBeenCalled()
  })
})
