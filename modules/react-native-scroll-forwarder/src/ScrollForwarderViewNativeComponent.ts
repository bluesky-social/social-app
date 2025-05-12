import {type ViewProps} from 'react-native'
import {
  type BubblingEventHandler,
  type Int32,
} from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

type OnRefreshEvent = {}

export interface NativeProps extends ViewProps {
  scrollViewTag: Int32 | null
  refreshing?: boolean
  onRefresh?: BubblingEventHandler<OnRefreshEvent>
}

export default codegenNativeComponent<NativeProps>('ScrollForwarderView')
