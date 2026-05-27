export function clamp01(n: number) {
  'worklet'
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}
