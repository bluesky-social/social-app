import {NotImplementedError} from '../NotImplemented'
import {type VisibilityViewProps} from './types'

export async function updateActiveViewAsync() {
  throw new NotImplementedError()
}

export default function VisibilityView({children}: VisibilityViewProps) {
  return children
}
