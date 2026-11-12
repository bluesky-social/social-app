import {NotImplementedError} from '../NotImplemented'

export function isInstalled(kind: string): Promise<boolean> {
  throw new NotImplementedError({kind})
}
