import {NotImplementedError} from '../NotImplemented'

export function downloadAsync(
  sourceUrl: string,
  progressCb: (progress: number) => void,
): Promise<string> {
  throw new NotImplementedError({sourceUrl, progressCb})
}

export function cancelAsync(sourceUrl: string): Promise<void> {
  throw new NotImplementedError({sourceUrl})
}
