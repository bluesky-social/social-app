/**
 * Drawing engine data model (DESIGN.md §5).
 *
 * The stroke list is the single source of truth: it backs rendering, undo,
 * draft persistence, and (later) timelapse export. Coordinates are stored in
 * canvas space, never screen space, so pan/zoom cannot corrupt stored data.
 */

export type Point = {
  x: number // canvas-space
  y: number
  p: number // pressure, 0..1. Defaults to 1.0 when the device reports none.
  t: number // ms since stroke start. Unused in v1; enables timelapse later.
}

export type BrushMode = 'draw' | 'erase'

export type Brush = {
  color: string // hex
  size: number // px at 1.0 pressure
  opacity: number // 0..1
  mode: BrushMode
}

export type Stroke = {
  id: string
  brush: Brush
  points: Point[]
  seed: number // for any RNG-based brush; guarantees identical replay
}

export type LayerKind = 'image' | 'ink'

export type Layer = {
  id: string
  kind: LayerKind
  locked: boolean
  imageUri?: string // kind: 'image' — local cached copy
  strokes: Stroke[] // kind: 'ink'
}

export type SourcePost = {
  uri: string
  cid: string
  authorHandle: string
}

export type Drawing = {
  id: string
  createdAt: number
  updatedAt: number
  width: number // canvas dimensions, fixed at creation
  height: number
  layers: Layer[]
  // Provenance, when drawing on someone else's image.
  sourcePost?: SourcePost
}

/** Default blank-canvas dimensions (DESIGN.md §13 — fixed square for v1). */
export const DEFAULT_CANVAS_SIZE = 2048
