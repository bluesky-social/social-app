import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'
import {StyleSheet, TextProps, ViewStyle} from 'react-native'
import {
  ExpoUITextViewChildNativeProps,
  ExpoUITextViewNativeProps,
  ExpoUITextViewProps,
} from './ExpoUITextView.types'

const ExpoUITextViewRoot: React.ComponentType<ExpoUITextViewNativeProps> =
  requireNativeViewManager('ExpoUITextView')

const ExpoUITextViewChild: React.ComponentType<ExpoUITextViewChildNativeProps> =
  requireNativeViewManager('ExpoUITextViewChild')

const TextAncestorContext = React.createContext<[boolean, ViewStyle]>([
  false,
  StyleSheet.create({}),
])
const useTextAncestorContext = () => React.useContext(TextAncestorContext)

const textDefaults: TextProps = {
  allowFontScaling: true,
  selectable: true,
  lineBreakMode: 'tail',
}

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
        <ExpoUITextViewRoot
          {...textDefaults}
          {...rest}
          style={[{flex: 1}, rootStyle]}>
          {React.Children.toArray(children).map((c, index) => {
            if (React.isValidElement(c)) {
              return c
            } else if (typeof c === 'string') {
              return (
                <ExpoUITextViewChild
                  key={index}
                  textStyle={flattenedStyle}
                  text={c}
                  onTextPress={onPress}
                  {...rest}
                />
              )
            }
          })}
        </ExpoUITextViewRoot>
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
              <ExpoUITextViewChild
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
