export type VideoProgressPhase = 'compressing' | 'uploading' | 'processing'

// Keep progress monotonic across the full client pipeline instead of showing
// three separate 0 -> 100 cycles. Backend processing progress covers the
// entire server-side job, so it maps directly onto the final half.
const PHASE_RANGES: Record<VideoProgressPhase, [number, number]> = {
  compressing: [0, 0.3],
  uploading: [0.3, 0.5],
  processing: [0.5, 1],
}

export function videoProgressForPhase(
  phase: VideoProgressPhase,
  phaseProgress: number,
): number {
  const [start, end] = PHASE_RANGES[phase]
  const clamped = Math.min(1, Math.max(0, phaseProgress))
  return start + (end - start) * clamped
}

export function advanceVideoProgress(
  currentProgress: number,
  phase: VideoProgressPhase,
  phaseProgress: number,
): number {
  return Math.max(currentProgress, videoProgressForPhase(phase, phaseProgress))
}
