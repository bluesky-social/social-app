import {Component} from 'react'

import {type BottomSheetViewProps} from './BottomSheet.types'

export class BottomSheetNativeComponent extends Component<BottomSheetViewProps> {
  /*
   * Native sheets do not exist on web; there is nothing to dismiss.
   */
  static dismissAll = async () => {}

  render(): never {
    throw new Error('BottomSheetNativeComponent is not available on web')
  }
}
