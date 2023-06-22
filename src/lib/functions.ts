export function choose<U, T extends Record<string, U>>(
  value: keyof T,
  choices: T,
): U {
  return choices[value]
}

export function dedupArray<T>(arr: T[]): T[] {
  const s = new Set(arr)
  return [...s]
}
