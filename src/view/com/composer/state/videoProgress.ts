export type VideoProgressPhase = 'compressing' | 'uploading' | 'processing'

// Keep progress monotonic across the full client pipeline instead of showing
// three separate 0 -> 100 cycles. Processing stops short of complete because
// a server-reported 100% can precede the completed blob becoming available.
const PHASE_RANGES: Record<VideoProgressPhase, [number, number]> = {
  compressing: [0, 0.4],
  uploading: [0.4, 0.55],
  processing: [0.55, 0.95],
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
