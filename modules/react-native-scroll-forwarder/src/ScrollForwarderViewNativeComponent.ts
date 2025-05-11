import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import type {ViewProps} from 'react-native'
import {Int32} from 'react-native/Libraries/Types/CodegenTypes'

export interface NativeProps extends ViewProps {
  scrollViewTag?: Int32
}

export default codegenNativeComponent<NativeProps>('ScrollForwarderView')
