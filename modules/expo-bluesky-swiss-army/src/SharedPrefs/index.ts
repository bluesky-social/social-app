import {NotImplementedError} from '../NotImplemented'

export function setValueAsync(
  key: string,
  value: string | number | boolean | null | undefined,
): Promise<void> {
  throw new NotImplementedError({key, value})
}

export function removeValueAsync(key: string): Promise<void> {
  throw new NotImplementedError({key})
}

export function getStringAsync(key: string): Promise<string | null> {
  console.log('call')
  throw new NotImplementedError({key})
}

export function getNumberAsync(key: string): Promise<number | null> {
  throw new NotImplementedError({key})
}

export function getBoolAsync(key: string): Promise<boolean | null> {
  throw new NotImplementedError({key})
}

export function addToSetAsync(key: string, value: string): Promise<void> {
  throw new NotImplementedError({key, value})
}

export function removeFromSetAsync(key: string, value: string): Promise<void> {
  throw new NotImplementedError({key, value})
}

export function setContainsAsync(key: string, value: string): Promise<boolean> {
  throw new NotImplementedError({key, value})
}
