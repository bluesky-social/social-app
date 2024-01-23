import {
  requireNativeComponent,
  UIManager,
  Platform,
  type ViewStyle,
  TextProps,
} from 'react-native'

const LINKING_ERROR =
  `The package 'react-native-ui-text-view' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

export interface RNUITextViewProps extends TextProps {
  children: React.ReactNode
  style: ViewStyle[]
}

export interface RNUITextViewChildProps extends TextProps {
  text: string
  onTextPress?: (...args: any[]) => void
  onTextLongPress?: (...args: any[]) => void
}

export const RNUITextView =
  UIManager.getViewManagerConfig &&
  UIManager.getViewManagerConfig('RNUITextView') != null
    ? requireNativeComponent<RNUITextViewProps>('RNUITextView')
    : () => {
        throw new Error(LINKING_ERROR)
      }

export const RNUITextViewChild =
  UIManager.getViewManagerConfig &&
  UIManager.getViewManagerConfig('RNUITextViewChild') != null
    ? requireNativeComponent<RNUITextViewChildProps>('RNUITextViewChild')
    : () => {
        throw new Error(LINKING_ERROR)
      }

export * from './UITextView'
