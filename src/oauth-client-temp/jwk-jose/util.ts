export function either<T extends string | number | boolean>(
  a?: T,
  b?: T,
): T | undefined {
  if (a != null && b != null && a !== b) {
    throw new TypeError(`Expected "${b}", got "${a}"`)
  }
  return a ?? b ?? undefined
}
