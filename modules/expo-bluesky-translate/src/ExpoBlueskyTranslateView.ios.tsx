import React from 'react'
import {Platform} from 'react-native'
import {requireNativeViewManager} from 'expo-modules-core'

import {ExpoBlueskyTranslateProps} from './ExpoBlueskyTranslate.types'

const NativeView: React.ComponentType<ExpoBlueskyTranslateProps> =
  requireNativeViewManager('ExpoBlueskyTranslate')

export function ExpoBlueskyTranslateView(props: ExpoBlueskyTranslateProps) {
  return <NativeView {...props} />
}

export const isAvailable = Number(Platform.Version) >= 17.4
