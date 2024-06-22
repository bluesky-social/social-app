import {NotImplementedError} from '../NotImplemented'

export function getStringValueAsync(
  key: string,
  useAppGroup?: boolean,
): Promise<string | null> {
  throw new NotImplementedError({key, useAppGroup})
}

export function setStringValueAsync(
  key: string,
  value: string | null,
  useAppGroup?: boolean,
): Promise<string | null> {
  throw new NotImplementedError({key, value, useAppGroup})
}
