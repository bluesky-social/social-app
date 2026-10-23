/*
 * Pure pieces of the probe's judgement, kept apart from measurement so they
 * can be unit tested without a native list.
 */

export type Verdict =
  | 'held'
  | 'drifted'
  | 'pushedDown'
  | 'jumped'
  | 'smooth'
  | 'lost'
  | 'oscillating'
  | 'unmeasured'

/** Human-readable verdict for the summary line. */
export const VERDICT_LABEL: Record<Verdict, string> = {
  held: 'HELD',
  drifted: 'DRIFTED',
  pushedDown: 'PUSHED DOWN BY THE PREPEND',
  jumped: 'JUMPED',
  smooth: 'SMOOTH',
  lost: 'LOST',
  oscillating: 'OSCILLATING',
  unmeasured: 'UNMEASURED',
}

/** A step on a moving run this far beyond the run's own speed reads as a jump. */
export const JUMP_EXCESS_PT = 150

export type VerdictInput = {
  hasAnchor: boolean
  /** The list was dragged or flung during the run. */
  moving: boolean
  /** A post-prepend feedback loop was detected during the run. */
  oscillating: boolean
  /** The anchor is mounted at settle and could be measured. */
  anchorMeasured: boolean
  /** Settled screen drift of the anchor, if measured. */
  drift: number | null
  /** Native offset at settle minus native offset before the prepend. */
  offsetDelta: number
  /** Total height of the rows inserted above the anchor during the run. */
  insertedAbove: number
  /** The anchor unmounted within a second of the commit. */
  lostEarly: boolean
  /** The largest anchor step beyond 4x the run's median speed. */
  jumpExcess: number | null
}

/**
 * - `pushedDown`: no correction was applied at all. The native offset never
 *   moved, so the anchor sits exactly `insertedAbove` lower, whether or not it
 *   is still mounted (scenario 6, and Android's skipped correction).
 * - `lost`: the anchor is gone and the offset did move, so the correction ran
 *   against something else (a teleport, or a window that unmounted the anchor
 *   mid-correction). Where the reader ended up is not knowable from the anchor.
 */
export function classifyRun(input: VerdictInput): Verdict {
  if (!input.hasAnchor) return 'unmeasured'
  if (input.oscillating) return 'oscillating'
  if (input.moving) {
    if (input.lostEarly) return 'lost'
    if (input.jumpExcess != null && input.jumpExcess > JUMP_EXCESS_PT) {
      return 'jumped'
    }
    return input.anchorMeasured ? 'smooth' : 'unmeasured'
  }
  const uncorrected =
    Math.abs(input.offsetDelta) <= 1 && input.insertedAbove > 1
  if (!input.anchorMeasured || input.drift == null) {
    return uncorrected ? 'pushedDown' : 'lost'
  }
  if (Math.abs(input.drift) <= 1) return 'held'
  if (uncorrected && Math.abs(input.drift - input.insertedAbove) <= 2) {
    return 'pushedDown'
  }
  return 'drifted'
}

/** One native scroll event. */
export type ScrollSample = {t: number; y: number; contentHeight: number}

export type Oscillation = {
  /** Time of the first oscillating step in the detection window. */
  since: number
  /** Native scroll events per second across the window. */
  ratePerSec: number
  /** Median time for the offset to come back to the same value: one cycle. */
  periodMs: number | null
  /** Peak-to-peak range of the offset across the window. */
  amplitude: number
  /** `offset - contentHeight`, which the loop holds constant. */
  offsetMinusContent: number
}

/** Look this far back for a loop. */
const OSC_WINDOW_MS = 3000
/** A loop must have been going this long, which rules out a settling ring (VL note 1). */
const OSC_MIN_DURATION_MS = 2000
/** And for at least this many paired steps. */
const OSC_MIN_STEPS = 8
/** The loop has stopped if nothing arrived for this long. */
const OSC_STALE_MS = 500
/** Steps smaller than this are noise, not a flip. */
const OSC_MIN_STEP_PT = 20
/** Offset and content height moving together, to within this. */
const OSC_PAIR_TOLERANCE_PT = 1.5
/** Two offsets this close count as the same position. */
const OSC_RETURN_TOLERANCE_PT = 1

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((x, y) => x - y)
  return sorted[Math.floor(sorted.length / 2)]
}

/**
 * The stock-RN loop QA found after some prepends: with no gesture, native
 * scroll events keep arriving (about 12-15/s), each moving the offset and the
 * content height by the same amount (`offset - contentHeight` stays constant,
 * so nothing moves on screen), back and forth between a few positions, for as
 * long as the list is mounted.
 *
 * A drag or fling moves the offset with the content height fixed, steady
 * growth never comes back, and a single correction or a settling ring doesn't
 * last two seconds, so none of them match. The caller excludes active drags.
 */
export function detectOscillation(
  samples: ScrollSample[],
  now: number,
): Oscillation | null {
  const recent = samples.filter(s => s.t >= now - OSC_WINDOW_MS)
  const last = recent.at(-1)
  if (!last || now - last.t > OSC_STALE_MS || recent.length < 3) return null

  const steps: {i: number; t: number; dy: number}[] = []
  for (let i = 1; i < recent.length; i++) {
    const dy = recent[i].y - recent[i - 1].y
    const dh = recent[i].contentHeight - recent[i - 1].contentHeight
    if (
      Math.abs(dy) >= OSC_MIN_STEP_PT &&
      Math.abs(dy - dh) <= OSC_PAIR_TOLERANCE_PT
    ) {
      steps.push({i, t: recent[i].t, dy})
    }
  }
  if (steps.length < OSC_MIN_STEPS) return null
  // Most events are part of the loop, not a gesture with the odd pair in it.
  if (steps.length < 0.6 * (recent.length - 1)) return null
  const first = steps[0]
  if (steps[steps.length - 1].t - first.t < OSC_MIN_DURATION_MS) return null

  // It goes back and forth...
  let turns = 0
  for (let k = 1; k < steps.length; k++) {
    if (Math.sign(steps[k].dy) !== Math.sign(steps[k - 1].dy)) turns++
  }
  if (turns < 0.4 * (steps.length - 1)) return null

  // ...within a band a few steps wide, rather than travelling.
  const looping = recent.slice(first.i - 1)
  const ys = looping.map(s => s.y)
  const amplitude = Math.max(...ys) - Math.min(...ys)
  const stepSize = median(steps.map(s => Math.abs(s.dy))) ?? 0
  if (amplitude > 3 * stepSize) return null

  // A cycle is the time to come back to the same offset after leaving it.
  const cycles: number[] = []
  for (let a = 0; a < looping.length; a++) {
    let left = false
    for (let b = a + 1; b < looping.length; b++) {
      const d = Math.abs(looping[b].y - looping[a].y)
      if (d >= OSC_MIN_STEP_PT) left = true
      else if (left && d <= OSC_RETURN_TOLERANCE_PT) {
        cycles.push(looping[b].t - looping[a].t)
        break
      }
    }
  }
  const span = last.t - recent[0].t

  return {
    since: first.t,
    ratePerSec: span > 0 ? ((recent.length - 1) / span) * 1000 : 0,
    periodMs: median(cycles),
    amplitude,
    offsetMinusContent: last.y - last.contentHeight,
  }
}

export function describeOscillation(osc: Oscillation) {
  const period = osc.periodMs != null ? `${Math.round(osc.periodMs)}ms` : '–'
  return `period ${period}, ${Math.round(osc.amplitude)}pt peak to peak, ${Math.round(osc.ratePerSec)} events/s`
}
