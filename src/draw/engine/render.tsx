/**
 * Skia rendering for the drawing engine (DESIGN.md §6.2, §6.3, §6.5).
 *
 * Committed strokes render as filled variable-width ribbons so speed-derived
 * width dynamics are visible. Ink lives inside an isolated Skia layer so the
 * eraser can composite out with BlendMode.Clear without punching through the
 * background (non-destructive erase — §13). The in-progress stroke paints from
 * a shared-value polyline with no React involvement.
 *
 * Raster checkpointing (§6.4): every CHECKPOINT_INTERVAL strokes the committed
 * ink up to that boundary is flattened to an SkImage, so a full replay only
 * covers the tail past the last checkpoint. rasterizeStrokes is also the
 * primitive milestone 4 will reuse for PNG export.
 */

import {useEffect, useMemo, useState} from 'react'
import {type SharedValue} from 'react-native-reanimated'
import {
  BlendMode,
  Canvas,
  Group,
  Image,
  Paint,
  PaintStyle,
  Path,
  Skia,
  type SkImage,
  type SkPath,
  StrokeCap,
  StrokeJoin,
} from '@shopify/react-native-skia'

import {computeWidths} from './geometry'
import {type Brush, type Point, type Stroke} from './types'

export const CHECKPOINT_INTERVAL = 25

function mid(a: Point, b: Point): {x: number; y: number} {
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}
}

/**
 * Smoothed centerline as an SkPath, built programmatically (§6.2): move through
 * the midpoints with each raw point as the quad control. Stored points are not
 * transformed — this is render-time only.
 */
function centerlinePath(points: Point[]): SkPath {
  const path = Skia.Path.Make()
  if (points.length === 0) return path
  if (points.length < 3) {
    path.moveTo(points[0].x, points[0].y)
    path.lineTo(points[points.length - 1].x, points[points.length - 1].y)
    return path
  }
  path.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length - 1; i++) {
    const end = mid(points[i], points[i + 1])
    path.quadTo(points[i].x, points[i].y, end.x, end.y)
  }
  const last = points[points.length - 1]
  path.lineTo(last.x, last.y)
  return path
}

/**
 * Representative stroke width from the speed-derived per-point widths (§6.3):
 * the median, so a fast flick renders thinner than a slow drag. True
 * intra-stroke width variation is a later refinement; a solid stroked
 * centerline is used here for reliable, gap-free rendering.
 */
function representativeWidth(stroke: Stroke): number {
  const widths = computeWidths(stroke.points, stroke.brush)
  if (widths.length === 0) return stroke.brush.size
  const sorted = [...widths].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/** A single committed stroke. Memoized so replay skips unchanged strokes. */
function StrokeShape({stroke}: {stroke: Stroke}) {
  const path = useMemo(() => centerlinePath(stroke.points), [stroke])
  const width = useMemo(() => representativeWidth(stroke), [stroke])
  const isErase = stroke.brush.mode === 'erase'
  return (
    <Path
      path={path}
      color={stroke.brush.color}
      opacity={stroke.brush.opacity}
      style="stroke"
      strokeWidth={width}
      strokeCap="round"
      strokeJoin="round"
      blendMode={isErase ? 'clear' : 'srcOver'}
    />
  )
}

/**
 * Flatten strokes to an SkImage at full canvas resolution. Used both for
 * checkpointing and (later) export. Returns null if the platform cannot
 * allocate an offscreen surface.
 */
export function rasterizeStrokes(
  strokes: Stroke[],
  width: number,
  height: number,
): SkImage | null {
  const surface = Skia.Surface.MakeOffscreen(width, height)
  if (!surface) return null
  const canvas = surface.getCanvas()
  for (const stroke of strokes) {
    const paint = Skia.Paint()
    paint.setColor(Skia.Color(stroke.brush.color))
    paint.setAlphaf(stroke.brush.opacity)
    paint.setStyle(PaintStyle.Stroke)
    paint.setStrokeWidth(representativeWidth(stroke))
    paint.setStrokeCap(StrokeCap.Round)
    paint.setStrokeJoin(StrokeJoin.Round)
    paint.setBlendMode(
      stroke.brush.mode === 'erase' ? BlendMode.Clear : BlendMode.SrcOver,
    )
    canvas.drawPath(centerlinePath(stroke.points), paint)
  }
  surface.flush()
  return surface.makeImageSnapshot()
}

type Checkpoint = {image: SkImage; count: number}

/**
 * Maintain a rasterized checkpoint of the committed ink. Rebuilds when the
 * stroke count crosses a new interval boundary, and invalidates when undo
 * shrinks the list below the cached boundary.
 */
function useCheckpoint(
  strokes: Stroke[],
  width: number,
  height: number,
): Checkpoint | null {
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null)

  useEffect(() => {
    const covered = checkpoint?.count ?? 0
    if (strokes.length < covered) {
      // Undo dropped below the checkpoint — discard and let it rebuild.
      setCheckpoint(null)
      return
    }
    const boundary =
      Math.floor(strokes.length / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL
    if (boundary > covered) {
      const image = rasterizeStrokes(strokes.slice(0, boundary), width, height)
      if (image) setCheckpoint({image, count: boundary})
    }
  }, [strokes, width, height, checkpoint])

  return checkpoint
}

export type DrawingCanvasProps = {
  strokes: Stroke[]
  livePath: SharedValue<string>
  liveBrush: Brush
  canvasSize: number
  viewSize: number
}

export function DrawingCanvas({
  strokes,
  livePath,
  liveBrush,
  canvasSize,
  viewSize,
}: DrawingCanvasProps) {
  const checkpoint = useCheckpoint(strokes, canvasSize, canvasSize)
  const displayScale = viewSize / canvasSize
  const tail = checkpoint ? strokes.slice(checkpoint.count) : strokes
  const liveIsErase = liveBrush.mode === 'erase'

  return (
    <Canvas style={{width: viewSize, height: viewSize}}>
      <Group transform={[{scale: displayScale}]}>
        {/* Isolated ink layer so eraser Clear stays within the ink. */}
        <Group layer={<Paint />}>
          {checkpoint && (
            <Image
              image={checkpoint.image}
              x={0}
              y={0}
              width={canvasSize}
              height={canvasSize}
              fit="none"
            />
          )}
          {tail.map(stroke => (
            <StrokeShape key={stroke.id} stroke={stroke} />
          ))}
          <Path
            path={livePath}
            color={liveBrush.color}
            opacity={liveBrush.opacity}
            style="stroke"
            strokeWidth={liveBrush.size}
            strokeCap="round"
            strokeJoin="round"
            blendMode={liveIsErase ? 'clear' : 'srcOver'}
          />
        </Group>
      </Group>
    </Canvas>
  )
}
