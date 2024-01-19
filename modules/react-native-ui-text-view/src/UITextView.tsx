import React from 'react'
import {StyleSheet, TextProps, ViewStyle} from 'react-native'
import {RNUITextView, RNUITextViewChild} from './index'

const TextAncestorContext = React.createContext<[boolean, ViewStyle]>([
  false,
  StyleSheet.create({}),
])
const useTextAncestorContext = () => React.useContext(TextAncestorContext)

const textDefaults: TextProps = {
  allowFontScaling: true,
  selectable: true,
}

export function UITextView({style, children, onPress, ...rest}: TextProps) {
  const [isAncestor, rootStyle] = useTextAncestorContext()

  // Flatten the styles, and apply the root styles when needed
  const flattenedStyle = React.useMemo(
    () => StyleSheet.flatten([rootStyle, style]),
    [rootStyle, style],
  )

  if (!isAncestor) {
    return (
      <TextAncestorContext.Provider value={[true, flattenedStyle]}>
        <RNUITextView
          {...textDefaults}
          {...rest}
          ellipsizeMode={rest.ellipsizeMode ?? rest.lineBreakMode ?? 'tail'}
          style={[{flex: 1}, flattenedStyle]}>
          {React.Children.toArray(children).map((c, index) => {
            if (React.isValidElement(c)) {
              return c
            } else if (typeof c === 'string') {
              return (
                <RNUITextViewChild
                  key={index}
                  style={flattenedStyle}
                  text={c}
                  onTextPress={onPress}
                  {...rest}
                />
              )
            }
          })}
        </RNUITextView>
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
              <RNUITextViewChild
                key={index}
                style={flattenedStyle}
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
