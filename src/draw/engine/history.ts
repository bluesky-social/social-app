/**
 * Command-based undo/redo (DESIGN.md §6.4). Snapshot stacks are avoided on
 * purpose: a 2048² RGBA frame is ~16MB, so 20 snapshot levels would be ~320MB
 * and get the process OOM-killed. Instead we keep the list of commands and
 * derive the current stroke list by applying them. Undo pops a command; the
 * redo stack is cleared whenever a new stroke is drawn.
 *
 * This module is pure (no React, no Skia) so the history semantics are
 * unit-testable. Raster checkpointing — the render-time optimization that
 * replays only from the last cached SkImage — lives in render.tsx, keyed off
 * the stroke count this module produces.
 */

import {type Stroke} from './types'

export type Command =
  | {type: 'add'; stroke: Stroke}
  | {type: 'clear'; removed: Stroke[]}

export type HistoryState = {
  strokes: Stroke[] // current committed strokes, in paint order
  undo: Command[]
  redo: Command[]
}

export function emptyHistory(): HistoryState {
  return {strokes: [], undo: [], redo: []}
}

/** Commit a new stroke. Clears the redo stack (§6.4). */
export function addStroke(state: HistoryState, stroke: Stroke): HistoryState {
  return {
    strokes: [...state.strokes, stroke],
    undo: [...state.undo, {type: 'add', stroke}],
    redo: [],
  }
}

/** Remove every stroke as a single undoable command. */
export function clearStrokes(state: HistoryState): HistoryState {
  if (state.strokes.length === 0) return state
  return {
    strokes: [],
    undo: [...state.undo, {type: 'clear', removed: state.strokes}],
    redo: [],
  }
}

export function canUndo(state: HistoryState): boolean {
  return state.undo.length > 0
}

export function canRedo(state: HistoryState): boolean {
  return state.redo.length > 0
}

export function undo(state: HistoryState): HistoryState {
  const cmd = state.undo[state.undo.length - 1]
  if (!cmd) return state
  const undoRest = state.undo.slice(0, -1)
  let strokes: Stroke[]
  switch (cmd.type) {
    case 'add':
      strokes = state.strokes.slice(0, -1)
      break
    case 'clear':
      strokes = cmd.removed
      break
  }
  return {strokes, undo: undoRest, redo: [...state.redo, cmd]}
}

export function redo(state: HistoryState): HistoryState {
  const cmd = state.redo[state.redo.length - 1]
  if (!cmd) return state
  const redoRest = state.redo.slice(0, -1)
  let strokes: Stroke[]
  switch (cmd.type) {
    case 'add':
      strokes = [...state.strokes, cmd.stroke]
      break
    case 'clear':
      strokes = []
      break
  }
  return {strokes, undo: [...state.undo, cmd], redo: redoRest}
}
