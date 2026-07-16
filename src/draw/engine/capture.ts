/**
 * Stroke capture (DESIGN.md §6.1). Points are gathered on the UI thread inside
 * a gesture worklet — no React re-render per touch sample — decimated on
 * ingest, then handed to JS once on release. A lightweight polyline preview is
 * exposed as a shared value so the in-progress stroke paints without involving
 * React at all; the smooth variable-width version is built when the finished
 * stroke is committed (see render.tsx).
 */

import {useMemo} from 'react'
import {Gesture} from 'react-native-gesture-handler'
import {
  runOnJS,
  type SharedValue,
  useSharedValue,
} from 'react-native-reanimated'

import {shouldKeepPoint} from './geometry'
import {type Point} from './types'

export type StrokeCaptureConfig = {
  /**
   * Display scale = viewSize / canvasSize. Touches arrive in view space; the
   * canvas-space coordinate we store is viewCoord / scale (§5: store canvas
   * space, never screen space).
   */
  scale: SharedValue<number>
  /** Called once on release with the raw (decimated) canvas-space points. */
  onStrokeEnd: (points: Point[]) => void
}

export type StrokeCapture = {
  gesture: ReturnType<typeof Gesture.Pan>
  /** Live preview polyline of the in-progress stroke, in canvas space (SVG). */
  livePath: SharedValue<string>
  /** True while a stroke is being drawn. */
  isDrawing: SharedValue<boolean>
}

export function useStrokeCapture(config: StrokeCaptureConfig): StrokeCapture {
  const {scale, onStrokeEnd} = config

  const points = useSharedValue<Point[]>([])
  const livePath = useSharedValue<string>('')
  const isDrawing = useSharedValue<boolean>(false)
  const startTime = useSharedValue<number>(0)

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .minDistance(0)
        .onBegin(e => {
          'worklet'
          const now = performance.now()
          startTime.value = now
          const pt: Point = {
            x: e.x / scale.value,
            y: e.y / scale.value,
            p: 1,
            t: 0,
          }
          points.value = [pt]
          livePath.value = `M ${pt.x} ${pt.y}`
          isDrawing.value = true
        })
        .onUpdate(e => {
          'worklet'
          const next: Point = {
            x: e.x / scale.value,
            y: e.y / scale.value,
            p: 1,
            t: performance.now() - startTime.value,
          }
          const prev = points.value[points.value.length - 1]
          if (!shouldKeepPoint(prev, next)) return
          points.value = [...points.value, next]
          livePath.value += ` L ${next.x} ${next.y}`
        })
        .onEnd(() => {
          'worklet'
          const captured = points.value
          if (captured.length > 0) {
            runOnJS(onStrokeEnd)(captured)
          }
        })
        .onFinalize(() => {
          'worklet'
          isDrawing.value = false
          livePath.value = ''
          points.value = []
        }),
    [scale, points, livePath, isDrawing, startTime, onStrokeEnd],
  )

  return {gesture, livePath, isDrawing}
}
