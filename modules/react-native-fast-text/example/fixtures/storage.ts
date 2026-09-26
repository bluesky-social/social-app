/** The typography harness does not load account storage or app networking. */
const values = new Map<string, unknown>()
export const device = {
  get([key]: string[]) {
    return values.get(key)
  },
  set([key]: string[], value: unknown) {
    values.set(key, value)
  },
}
