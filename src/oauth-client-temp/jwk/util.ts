// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = { [K in keyof T]: T[K] } & {}
export type Override<T, V> = Simplify<V & Omit<T, keyof V>>

export type RequiredKey<T, K extends string> = Simplify<
  string extends K
    ? T
    : {
        [L in K]: Exclude<L extends keyof T ? T[L] : unknown, undefined>
      } & Omit<T, K>
>

export const isDefined = <T>(i: T | undefined): i is T => i !== undefined

export const preferredOrderCmp =
  <T>(order: readonly T[]) =>
  (a: T, b: T) => {
    const aIdx = order.indexOf(a)
    const bIdx = order.indexOf(b)
    if (aIdx === bIdx) return 0
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  }

export function matchesAny<T extends string | number | symbol | boolean>(
  value: null | undefined | T | readonly T[],
): (v: unknown) => v is T {
  return value == null
    ? (v): v is T => true
    : Array.isArray(value)
      ? (v): v is T => value.includes(v)
      : (v): v is T => v === value
}

/**
 * Decorator to cache the result of a getter on a class instance.
 */
export const cachedGetter = <T extends object, V>(
  target: (this: T) => V,
  _context: ClassGetterDecoratorContext<T, V>,
) => {
  return function (this: T) {
    const value = target.call(this)
    Object.defineProperty(this, target.name, {
      get: () => value,
      enumerable: true,
      configurable: true,
    })
    return value
  }
}

export const decoder = new TextDecoder()
export const ui8ToString = (value: Uint8Array) => decoder.decode(value)
