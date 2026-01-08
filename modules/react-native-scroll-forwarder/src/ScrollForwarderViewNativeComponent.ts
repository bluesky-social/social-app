import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
} from 'react-native'

type OnRefreshEvent = {}

export interface NativeProps extends ViewProps {
  scrollViewTag: CodegenTypes.Int32 | null
  refreshing?: boolean
  onRefresh?: CodegenTypes.BubblingEventHandler<OnRefreshEvent>
}

export default codegenNativeComponent<NativeProps>('ScrollForwarderView')
