import {NotImplementedError} from '../NotImplemented'

export function setValue(
  key: string,
  value: string | number | boolean | null | undefined,
): void {
  throw new NotImplementedError({key, value})
}

export function removeValue(key: string): void {
  throw new NotImplementedError({key})
}

export function getString(key: string): string | null {
  throw new NotImplementedError({key})
}

export function getNumber(key: string): number | null {
  throw new NotImplementedError({key})
}

export function getBool(key: string): boolean | null {
  throw new NotImplementedError({key})
}

export function addToSet(key: string, value: string): void {
  throw new NotImplementedError({key, value})
}

export function removeFromSet(key: string, value: string): void {
  throw new NotImplementedError({key, value})
}

export function setContains(key: string, value: string): boolean {
  throw new NotImplementedError({key, value})
}
