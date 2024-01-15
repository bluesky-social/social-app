import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'
import {StyleSheet, ViewStyle} from 'react-native'
import {
  ExpoUITextViewChildNativeProps,
  ExpoUITextViewNativeProps,
  ExpoUITextViewProps,
} from './ExpoUITextView.types'

const NativeView: React.ComponentType<ExpoUITextViewNativeProps> =
  requireNativeViewManager('ExpoSelectableText')

const NativeViewChild: React.ComponentType<ExpoUITextViewChildNativeProps> =
  requireNativeViewManager('ExpoTextChild')

const TextAncestorContext = React.createContext<[boolean, ViewStyle]>([
  false,
  StyleSheet.create({}),
])
const useTextAncestorContext = () => React.useContext(TextAncestorContext)

export default function ExpoUITextView({
  style,
  children,
  onPress,
  ...rest
}: ExpoUITextViewProps) {
  const [isAncestor, rootStyle] = useTextAncestorContext()

  // Flatten the styles, and apply the root styles when needed
  const flattenedStyle = React.useMemo(
    () => StyleSheet.flatten([rootStyle, style]),
    [rootStyle, style],
  )

  if (!isAncestor) {
    return (
      <TextAncestorContext.Provider value={[true, flattenedStyle]}>
        <NativeView style={{flex: 1}}>
          {React.Children.toArray(children).map((c, index) => {
            if (React.isValidElement(c)) {
              return c
            } else if (typeof c === 'string') {
              return (
                <NativeViewChild
                  key={index}
                  textStyle={flattenedStyle}
                  text={c}
                  onTextPress={onPress}
                  {...rest}
                />
              )
            }
          })}
        </NativeView>
      </TextAncestorContext.Provider>
    )
  } else {
    return (
      <>
        {React.Children.toArray(children).map((c, index) => {
          if (React.isValidElement(c)) {
            return c
          } else if (typeof c === 'string') {
            return (
              <NativeViewChild
                key={index}
                textStyle={flattenedStyle}
                text={c}
                onTextPress={onPress}
                {...rest}
              />
            )
          }
        })}
      </>
    )
  }
}
