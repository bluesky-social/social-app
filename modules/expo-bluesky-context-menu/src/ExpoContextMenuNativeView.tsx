import {type ComponentType} from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {type NativeViewProps} from './types'

const NativeView: ComponentType<NativeViewProps> = requireNativeViewManager(
  'ExpoBlueskyContextMenu',
)

export default NativeView
