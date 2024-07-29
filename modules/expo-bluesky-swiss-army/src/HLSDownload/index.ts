import {NotImplementedError} from '../NotImplemented'

export function downloadAsync(sourceUrl: string): Promise<string> {
  throw new NotImplementedError({sourceUrl})
}

export function cancelAsync(sourceUrl: string): Promise<void> {
  throw new NotImplementedError({sourceUrl})
}
