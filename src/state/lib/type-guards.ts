export function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

export function hasProp<K extends PropertyKey>(
  data: object,
  prop: K,
): data is Record<K, unknown> {
  return prop in data
}
