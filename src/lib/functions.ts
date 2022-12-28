export function choose<U, T extends Record<string, U>>(
  value: keyof T,
  choices: T,
): U {
  return choices[value]
}
