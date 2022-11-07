export function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

export function hasProp<K extends PropertyKey>(
  data: object,
  prop: K,
): data is Record<K, unknown> {
  return prop in data
}

export function isStrArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(item => typeof item === 'string')
}
