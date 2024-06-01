import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import ExpoBlueskyTranslate from './ExpoBlueskyTranslate'

export const NativeTranslationModule = ExpoBlueskyTranslate

const NativeView: React.ComponentType = requireNativeViewManager(
  'ExpoBlueskyTranslate',
)

export function NativeTranslationView() {
  return <NativeView />
}
