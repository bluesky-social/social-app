/*
 * How a list is moving, and when work that must not happen under a moving
 * list may run. A pure state machine: `stepListMotion` takes the list's
 * signals and returns the next state with what to do about it, and the hook
 * adapter (`useListMotion`) owns the timers and runs the work.
 *
 * Written for the feed's settlement at the top, and meant for the other work
 * that has to wait for a list to stop: committing prepends at rest, clearing
 * the new-posts pill, and the Home press that scrolls to the top first.
 */

/**
 * How close to its resting offset counts as the top of the list. The resting
 * offset is 0 where the header is padding inside the content, and negative
 * where the platform applies it as a content inset, so a small positive bound
 * reads as the top under both. Provisional, to be measured on device.
 */
export const LIST_AT_TOP_LIMIT = 5

/**
 * How long the list has to be quiet after something was committed above the
 * viewport before its position is trusted again: the
 * `maintainVisibleContentPosition` correction, and the list re-measuring the
 * new rows, arrive as scroll events with no gesture behind them, and their
 * offsets wobble until they are done.
 */
export const LIST_QUIET_PERIOD_MS = 250

/**
 * How long to wait for the scroll event a commit above the viewport causes,
 * before trusting the position from before it anyway: a commit that moves
 * nothing (a page that renders no rows) causes none.
 */
export const LIST_COMMIT_CORRECTION_TIMEOUT_MS = 500

/**
 * How long a scroll the app started counts as motion when nothing reports its
 * end. iOS reports the end of an animated scroll as the end of momentum; a
 * scroll to where the list already is reports nothing at all.
 */
export const LIST_PROGRAMMATIC_SCROLL_TIMEOUT_MS = 1000

/** Where the list is, as a scroll event reports it. */
export type ListScrollPosition = {
  /** The raw `contentOffset.y`. */
  offsetY: number
  contentHeight: number
}

/** Whether an offset is at the top of the list - see {@link LIST_AT_TOP_LIMIT}. */
export function isAtTopOffset(offsetY: number) {
  'worklet'
  return offsetY <= LIST_AT_TOP_LIMIT
}

/**
 * Work to run once the list is at rest, and for `atTop` work, truly at the
 * top as well. Run once, then forgotten; a request with the id of one still
 * waiting replaces it.
 */
export type ListMotionRequest = {id: string; atTop: boolean}

export type ListMotionState = {
  /** A finger is on the list, or the deceleration after one is running. */
  isGestureActive: boolean
  /** A scroll the app started is in flight. */
  isProgrammaticScroll: boolean
  /**
   * Whether a movement has come to rest since the list mounted. Until one has,
   * the list has not arrived anywhere: where it first reports itself is where
   * it was put, as a restored feed is put at its top, not where anyone went.
   */
  hasMoved: boolean
  /**
   * Where the list last reported itself, and when. Unknown until it reports:
   * a list that has not said where it is is not at the top.
   */
  position: (ListScrollPosition & {at: number}) | undefined
  /**
   * When the list last dispatched a scroll event of its own accord. A
   * gesture's end carries a position but is not one of these: it reports where
   * the finger left the list, which a correction may be about to move.
   */
  lastActivityAt: number | undefined
  /**
   * When something was last committed above the viewport, until the list has
   * been seen to take it in - see {@link isCommitTakenIn}.
   */
  committedAt: number | undefined
  requests: readonly ListMotionRequest[]
}

export type ListMotionEvent =
  /** A finger started dragging the list. */
  | {type: 'gestureBegin'}
  /**
   * The list came to rest after a drag: at the end of a drag with no velocity,
   * or at the end of the deceleration after one. On iOS also the end of an
   * animated scroll the app started.
   */
  | {type: 'gestureEnd'; position: ListScrollPosition}
  /** The list dispatched a scroll event, for whatever reason. */
  | {type: 'scrollActivity'; position: ListScrollPosition}
  /** The app started an animated scroll of its own. */
  | {type: 'programmaticScrollBegin'}
  /** That scroll's fallback timer ran out. */
  | {type: 'programmaticScrollTimeout'}
  /**
   * Something was committed above the viewport - a prepend, or a write that
   * re-tunes the rows there - so the list is about to correct its offset.
   */
  | {type: 'committed'}
  | {type: 'request'; request: ListMotionRequest}
  | {type: 'cancel'; id: string}
  /** The timer the machine asked for ran out. */
  | {type: 'timer'}

export type ListMotionEffect =
  /** Run the work the request with this id was for. */
  | {type: 'run'; id: string}
  /** Replace the machine's timer with one `delay` from now. */
  | {type: 'schedule'; delay: number}
  | {type: 'cancelSchedule'}
  /** Replace the programmatic scroll's fallback timer. */
  | {type: 'scheduleProgrammaticTimeout'; delay: number}
  | {type: 'cancelProgrammaticTimeout'}

export function createListMotionState(): ListMotionState {
  return {
    isGestureActive: false,
    isProgrammaticScroll: false,
    hasMoved: false,
    position: undefined,
    lastActivityAt: undefined,
    committedAt: undefined,
    requests: [],
  }
}

/**
 * Advances the machine by one event. `now` is the caller's clock, so that
 * this reads none.
 */
export function stepListMotion(
  state: ListMotionState,
  event: ListMotionEvent,
  now: number,
): {state: ListMotionState; effects: ListMotionEffect[]} {
  const next: ListMotionState = {...state}
  const effects: ListMotionEffect[] = []

  switch (event.type) {
    case 'gestureBegin': {
      next.isGestureActive = true
      /*
       * A commit's wait survives a touch: starting to move is no evidence that
       * its correction has landed.
       */
      break
    }
    case 'gestureEnd': {
      next.isGestureActive = false
      next.hasMoved = true
      next.position = {...event.position, at: now}
      if (next.isProgrammaticScroll) {
        next.isProgrammaticScroll = false
        effects.push({type: 'cancelProgrammaticTimeout'})
      }
      break
    }
    case 'scrollActivity': {
      next.position = {...event.position, at: now}
      next.lastActivityAt = now
      break
    }
    case 'programmaticScrollBegin': {
      next.isProgrammaticScroll = true
      effects.push({
        type: 'scheduleProgrammaticTimeout',
        delay: LIST_PROGRAMMATIC_SCROLL_TIMEOUT_MS,
      })
      break
    }
    case 'programmaticScrollTimeout': {
      if (next.isProgrammaticScroll) {
        next.isProgrammaticScroll = false
        // The scroll went where it was asked to, even if that was nowhere.
        next.hasMoved = true
      }
      break
    }
    case 'committed': {
      next.committedAt = now
      break
    }
    case 'request': {
      next.requests = [
        ...next.requests.filter(request => request.id !== event.request.id),
        event.request,
      ]
      break
    }
    case 'cancel': {
      next.requests = next.requests.filter(request => request.id !== event.id)
      if (next.requests.length === 0) {
        effects.push({type: 'cancelSchedule'})
      }
      return {state: next, effects}
    }
    case 'timer': {
      break
    }
  }

  effects.push(...evaluate(next, now))
  return {state: next, effects}
}

/**
 * Whether the list is at rest: nothing is moving it, and whatever was last
 * committed above the viewport has been taken in.
 */
export function isListAtRest(state: ListMotionState, now: number) {
  return !isInMotion(state) && isCommitTakenIn(state, now) === true
}

/**
 * Whether the list is at rest at the true top: it has been moved there, rather
 * than put there on mount, and reports being within {@link LIST_AT_TOP_LIMIT}
 * of it, from a position newer than the last commit above the viewport. Not
 * the same as being scrolled less than some threshold: a few hundred points
 * down, the rows a small prepend added are still above the viewport, unseen.
 */
export function isListTrulyAtTop(state: ListMotionState, now: number) {
  return (
    isListAtRest(state, now) &&
    state.hasMoved &&
    state.position !== undefined &&
    isAtTopOffset(state.position.offsetY)
  )
}

function isInMotion(state: ListMotionState) {
  return state.isGestureActive || state.isProgrammaticScroll
}

/**
 * Whether the list has taken in the last commit above the viewport, so that
 * where it says it is can be trusted again - or how much longer to wait.
 *
 * A happens-after test: a scroll event newer than the commit has to have
 * arrived, which on native is the commit's own correction, and the list has to
 * have been quiet since for {@link LIST_QUIET_PERIOD_MS}. A position read
 * before that is from before the correction, and would put the list at the
 * top it is about to be moved away from. The wait is capped at
 * {@link LIST_COMMIT_CORRECTION_TIMEOUT_MS} for a commit that moves nothing.
 */
function isCommitTakenIn(state: ListMotionState, now: number): true | number {
  if (state.committedAt === undefined) {
    return true
  }
  if (
    state.lastActivityAt !== undefined &&
    state.lastActivityAt > state.committedAt
  ) {
    const quietFor = now - state.lastActivityAt
    return quietFor >= LIST_QUIET_PERIOD_MS
      ? true
      : LIST_QUIET_PERIOD_MS - quietFor
  }
  const waitedFor = now - state.committedAt
  return waitedFor >= LIST_COMMIT_CORRECTION_TIMEOUT_MS
    ? true
    : LIST_COMMIT_CORRECTION_TIMEOUT_MS - waitedFor
}

/**
 * Runs what can run now, and asks for a timer if waiting is all that stands in
 * the way. Mutates `state`, which is the step's own copy.
 */
function evaluate(state: ListMotionState, now: number): ListMotionEffect[] {
  if (state.requests.length === 0 || isInMotion(state)) {
    // The end of the motion, or its fallback timer, evaluates again.
    return []
  }
  const takenIn = isCommitTakenIn(state, now)
  if (takenIn !== true) {
    return [{type: 'schedule', delay: takenIn}]
  }
  // Spent, so the next rest has nothing to wait out.
  state.committedAt = undefined
  const isTrulyAtTop = isListTrulyAtTop(state, now)
  const runnable = state.requests.filter(
    request => !request.atTop || isTrulyAtTop,
  )
  if (runnable.length === 0) {
    // Waiting for the list to be taken to the top, which no timer will do.
    return [{type: 'cancelSchedule'}]
  }
  state.requests = state.requests.filter(request => !runnable.includes(request))
  return [
    {type: 'cancelSchedule'},
    ...runnable.map(request => ({type: 'run', id: request.id}) as const),
  ]
}
