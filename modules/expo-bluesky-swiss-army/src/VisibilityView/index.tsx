import {NotImplementedError} from '../NotImplemented'
import {VisibilityViewProps} from './types'

export async function updateActiveViewAsync() {
  throw new NotImplementedError()
}

export default function VisibilityView({
  children,
  onChangeStatus: _onVisibilityChange,
}: VisibilityViewProps) {
  return children
}
