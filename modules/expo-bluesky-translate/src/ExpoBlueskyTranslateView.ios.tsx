import React from 'react'
import {Platform} from 'react-native'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {ExpoBlueskyTranslateModule} from './ExpoBlueskyTranslate.types'

export const NativeTranslationModule =
  requireNativeModule<ExpoBlueskyTranslateModule>('ExpoBlueskyTranslate')

const NativeView: React.ComponentType = requireNativeViewManager(
  'ExpoBlueskyTranslate',
)

export function NativeTranslationView() {
  return <NativeView />
}

export const isAvailable = Number(Platform.Version) >= 17.4
