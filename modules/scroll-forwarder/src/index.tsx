import {requireNativeComponent, UIManager, Platform} from 'react-native'
import React from 'react'

const LINKING_ERROR =
  `The package 'react-native-scroll-forwarder' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

export interface ScrollForwarderProps {
  scrollViewTag?: string
  onScrollViewRefresh?: () => Promise<void>
  scrollViewRefreshing?: boolean
  children: React.ReactNode
}

const ComponentName = 'ScrollForwarderView'

export const ScrollForwarderView =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? requireNativeComponent<ScrollForwarderProps>(ComponentName)
    : () => {
        throw new Error(LINKING_ERROR)
      }
