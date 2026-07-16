/**
 * Engine facade: owns brush + history state, wires stroke capture to the
 * command stack, and exposes the handlers the UI needs. DrawScreen (and later
 * the composer integration) talk to this hook rather than the internals.
 */

import {useCallback, useMemo, useState} from 'react'
import {useSharedValue} from 'react-native-reanimated'

import {useStrokeCapture} from './capture'
import {
  addStroke,
  canRedo,
  canUndo,
  clearStrokes,
  emptyHistory,
  type HistoryState,
  redo as redoHistory,
  undo as undoHistory,
} from './history'
import {type Brush, type Point, type Stroke} from './types'

export const DEFAULT_BRUSH: Brush = {
  color: '#111111',
  size: 14,
  opacity: 1,
  mode: 'draw',
}

let strokeCounter = 0
function makeStroke(brush: Brush, points: Point[]): Stroke {
  strokeCounter += 1
  return {
    id: `${Date.now().toString(36)}-${strokeCounter}`,
    brush: {...brush},
    points,
    seed: Math.floor(Math.random() * 1e9),
  }
}

export function useDrawingEngine(canvasSize: number) {
  const [history, setHistory] = useState<HistoryState>(emptyHistory)
  const [brush, setBrush] = useState<Brush>(DEFAULT_BRUSH)

  // Display scale (viewSize / canvasSize); DrawScreen updates it on layout.
  const scale = useSharedValue(1)

  const onStrokeEnd = useCallback(
    (points: Point[]) => {
      setHistory(h => addStroke(h, makeStroke(brush, points)))
    },
    [brush],
  )

  const {gesture, livePath} = useStrokeCapture({scale, onStrokeEnd})

  const undo = useCallback(() => setHistory(h => undoHistory(h)), [])
  const redo = useCallback(() => setHistory(h => redoHistory(h)), [])
  const clear = useCallback(() => setHistory(h => clearStrokes(h)), [])

  const setColor = useCallback(
    (color: string) => setBrush(b => ({...b, color, mode: 'draw'})),
    [],
  )
  const setSize = useCallback(
    (size: number) => setBrush(b => ({...b, size})),
    [],
  )
  const toggleErase = useCallback(
    () => setBrush(b => ({...b, mode: b.mode === 'erase' ? 'draw' : 'erase'})),
    [],
  )
  const setMode = useCallback(
    (mode: Brush['mode']) => setBrush(b => ({...b, mode})),
    [],
  )

  return useMemo(
    () => ({
      strokes: history.strokes,
      brush,
      gesture,
      livePath,
      scale,
      canvasSize,
      canUndo: canUndo(history),
      canRedo: canRedo(history),
      undo,
      redo,
      clear,
      setColor,
      setSize,
      setMode,
      toggleErase,
    }),
    [
      history,
      brush,
      gesture,
      livePath,
      scale,
      canvasSize,
      undo,
      redo,
      clear,
      setColor,
      setSize,
      setMode,
      toggleErase,
    ],
  )
}
