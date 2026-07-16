/**
 * Pure geometry helpers for the drawing engine. No React, no Skia — kept
 * dependency-free so the stroke math is unit-testable in plain Jest.
 *
 * Implements decimation (§6.1), midpoint smoothing (§6.2), and speed-derived
 * width dynamics (§6.3) from DESIGN.md.
 */

import {type Brush, type Point} from './types'

/** Drop a sample if it lands within this many canvas px of the previous one. */
export const DECIMATION_MIN_DISTANCE = 1.5

export function distance(a: Point, b: Point): number {
  'worklet'
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

/**
 * Decide whether a freshly sampled point is far enough from the last kept point
 * to be worth keeping (§6.1). Runs on the UI thread during capture, so it is a
 * worklet and takes the bare previous point rather than the whole array.
 */
export function shouldKeepPoint(prev: Point | undefined, next: Point): boolean {
  'worklet'
  if (!prev) return true
  return distance(prev, next) >= DECIMATION_MIN_DISTANCE
}

/** Decimate an already-captured list (e.g. replayed/imported strokes). */
export function decimate(points: Point[]): Point[] {
  if (points.length <= 2) return points.slice()
  const out: Point[] = [points[0]]
  for (let i = 1; i < points.length; i++) {
    if (distance(out[out.length - 1], points[i]) >= DECIMATION_MIN_DISTANCE) {
      out.push(points[i])
    }
  }
  // Always retain the final point so the stroke ends where the finger lifted.
  const last = points[points.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

/**
 * Speed-derived per-point widths (§6.3). Finger touch reports no real pressure
 * on most Android devices, so width is driven by drawing speed: slow strokes
 * are thick, fast strokes thin. Pressure (`p`, default 1.0) still scales the
 * baseline so a stylus gets dynamics for free.
 */
export const MIN_WIDTH_FRACTION = 0.35 // fastest strokes reach this fraction of size
const SPEED_HALF_LIFE = 2.5 // canvas px per ms at which width is ~midway

export function computeWidths(points: Point[], brush: Brush): number[] {
  const widths: number[] = new Array(points.length)
  for (let i = 0; i < points.length; i++) {
    const base = brush.size * points[i].p
    let speed = 0
    if (i > 0) {
      const dt = Math.max(1, points[i].t - points[i - 1].t)
      speed = distance(points[i - 1], points[i]) / dt
    } else if (points.length > 1) {
      const dt = Math.max(1, points[1].t - points[0].t)
      speed = distance(points[0], points[1]) / dt
    }
    // Exponential falloff: speed 0 → full width, high speed → MIN_WIDTH_FRACTION.
    const factor =
      MIN_WIDTH_FRACTION +
      (1 - MIN_WIDTH_FRACTION) * Math.exp(-speed / SPEED_HALF_LIFE)
    widths[i] = Math.max(0.5, base * factor)
  }
  // Smooth the width profile so speed jitter doesn't produce a lumpy stroke.
  return smoothSeries(widths, 1)
}

/** Simple symmetric moving average over a numeric series. */
function smoothSeries(values: number[], radius: number): number[] {
  if (radius <= 0 || values.length <= 2) return values
  const out = new Array(values.length)
  for (let i = 0; i < values.length; i++) {
    let sum = 0
    let n = 0
    for (let j = i - radius; j <= i + radius; j++) {
      if (j >= 0 && j < values.length) {
        sum += values[j]
        n++
      }
    }
    out[i] = sum / n
  }
  return out
}
