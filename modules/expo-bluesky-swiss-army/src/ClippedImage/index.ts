import {NotImplementedError} from '../NotImplemented'
import {type ClipImageOptions} from './types'

export function clipImageAsync(options: ClipImageOptions): Promise<string> {
  return Promise.reject(new NotImplementedError(options))
}
