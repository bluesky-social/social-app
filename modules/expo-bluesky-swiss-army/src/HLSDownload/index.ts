import {NotImplementedError} from '../NotImplemented'

export async function downloadAsync(
  sourceUrl: string,
  progressCb: (progress: number) => void,
): Promise<string> {
  throw new NotImplementedError({sourceUrl, progressCb})
}

export async function cancelAsync(sourceUrl: string): Promise<void> {
  throw new NotImplementedError({sourceUrl})
}
