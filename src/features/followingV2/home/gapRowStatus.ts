import {type GapFillOutcome} from './queries/postFeed'

/** The state of a gap row's own press (see `GapRow`). */
export type GapRowStatus = 'idle' | 'filling' | 'failed'

/**
 * What a gap row shows once the fill it started has ended:
 *
 * - `filled`: still filling. The gap is filled, but the feed's rows may not
 *   have caught up with the write yet, and going back to idle would offer
 *   “Show more posts” again meanwhile.
 * - `failed`: nothing was written, so it offers to try again.
 * - `superseded`: nothing was written. If the row is still there, it can be
 *   pressed again.
 */
export function gapRowStatusAfterFill(outcome: GapFillOutcome): GapRowStatus {
  switch (outcome) {
    case 'filled':
      return 'filling'
    case 'failed':
      return 'failed'
    case 'superseded':
      return 'idle'
  }
}
