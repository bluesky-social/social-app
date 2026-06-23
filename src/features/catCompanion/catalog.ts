// Retro Cats sprite-sheet metadata, ported from the standalone `retro-cats`
// Pixi module to plain data we can drive from React Native.
//
// Every coat is one PNG with an identical layout: a 16-wide grid of 64x64
// frames. Each animation is one row, played left-to-right starting at column
// 0, so a state is just a (row, frames, fps) triple that applies to every
// color. Frames are bottom-aligned within their cell.

// Frame side, in pixels. Sheets are a uniform square grid of these.
export const FRAME = 64
// Grid dimensions of every sheet (1024x1216 => 16 cols, 19 rows).
export const COLS = 16
export const ROWS = 19

export type CatColor =
  | 'cream'
  | 'black'
  | 'grey'
  | 'grey-white'
  | 'orange'
  | 'white'

export const CAT_COLORS: readonly CatColor[] = [
  'cream',
  'black',
  'grey',
  'grey-white',
  'orange',
  'white',
]

export type CatState =
  | 'Idle' // sit, tail sway
  | 'Excited' // stand up on hind legs
  | 'Happy' // crouched loaf, content
  | 'Chilling' // relaxed sit
  | 'Sleeping' // curled asleep (zzz)
  | 'Running' // horizontal gallop
  | 'Jump' // roll / flip over
  | 'Dance' // stand and dance
  | 'Tickle' // belly-up, paws in the air
  | 'Crying' // sit and sob
  | 'Surprised' // startled, mouth open
  | 'Box1' // sit up tall in a box
  | 'Box2' // play over the box edge
  | 'Box3' // settle down inside a box
  | 'Hurt' // take a hit
  | 'Attack' // pounce with a swipe
  | 'Dead1' // collapse (death A)
  | 'Dead2' // slump down (death B)
  | 'Dead' // lifeless, single pose

// One animation: a row of `frames` consecutive 64x64 cells starting at
// column 0. `fps` is the authored playback rate. `pad` shifts the sprite down
// by this many 64px-cell pixels: mostly it cancels the transparent padding
// below the cat's lowest point so every state shares one ground line (0 means
// flush), but it can also be nudged up a little to intentionally sink a pose
// (e.g. the curled sleeper, whose tail should sit slightly off the bottom).
export interface CatClip {
  row: number
  frames: number
  fps: number
  pad: number
}

// row/frames decoded from the sheet (16x19 grid, 64px cells).
export const CLIPS: Record<CatState, CatClip> = {
  Idle: {row: 0, frames: 6, fps: 8, pad: 0},
  Excited: {row: 1, frames: 3, fps: 8, pad: 0},
  Dead: {row: 2, frames: 1, fps: 6, pad: 3},
  Sleeping: {row: 3, frames: 4, fps: 5, pad: 6}, // nudged down so the tail clips
  Happy: {row: 4, frames: 10, fps: 8, pad: 2},
  Running: {row: 5, frames: 6, fps: 12, pad: 5},
  Jump: {row: 6, frames: 12, fps: 12, pad: 0},
  Box1: {row: 7, frames: 12, fps: 8, pad: 0},
  Box2: {row: 8, frames: 10, fps: 8, pad: 3},
  Box3: {row: 9, frames: 12, fps: 8, pad: 3},
  Crying: {row: 10, frames: 4, fps: 6, pad: 0},
  Dance: {row: 11, frames: 4, fps: 8, pad: 0},
  Chilling: {row: 12, frames: 8, fps: 6, pad: 0},
  Surprised: {row: 13, frames: 2, fps: 8, pad: 0},
  Tickle: {row: 14, frames: 4, fps: 8, pad: 0},
  Dead1: {row: 15, frames: 6, fps: 8, pad: 2},
  Dead2: {row: 16, frames: 5, fps: 8, pad: 6},
  Hurt: {row: 17, frames: 8, fps: 10, pad: 5},
  Attack: {row: 18, frames: 7, fps: 10, pad: 6},
}

// States that loop forever. Everything else is a one-shot that plays once,
// holds its last frame, and reports completion via CatSprite's onAnimationEnd.
export const LOOP_STATES: readonly CatState[] = [
  'Idle',
  'Happy',
  'Chilling',
  'Sleeping',
  'Running',
  'Jump',
  'Dance',
  'Tickle',
  'Crying',
  'Box1',
  'Box2',
  'Box3',
]

export function isLoopState(state: CatState): boolean {
  return LOOP_STATES.includes(state)
}

export const DEFAULT_COLOR: CatColor = 'orange'
