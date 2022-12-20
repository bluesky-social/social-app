import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import LinearGradient from 'react-native-linear-gradient'
import {Text} from './Text'
import {colors, gradients} from '../../lib/styles'

export function ErrorMessage({
  message,
  numberOfLines,
  dark,
  style,
  onPressTryAgain,
}: {
  message: string
  numberOfLines?: number
  dark?: boolean
  style?: StyleProp<ViewStyle>
  onPressTryAgain?: () => void
}) {
  const inner = (
    <>
      <View style={[styles.errorIcon, dark ? styles.darkErrorIcon : undefined]}>
        <FontAwesomeIcon
          icon="exclamation"
          style={{color: dark ? colors.red3 : colors.white}}
          size={16}
        />
      </View>
      <Text
        style={[styles.message, dark ? styles.darkMessage : undefined]}
        numberOfLines={numberOfLines}>
        {message}
      </Text>
      {onPressTryAgain && (
        <TouchableOpacity style={styles.btn} onPress={onPressTryAgain}>
          <FontAwesomeIcon
            icon="arrows-rotate"
            style={{color: dark ? colors.white : colors.red4}}
            size={16}
          />
        </TouchableOpacity>
      )}
    </>
  )
  if (dark) {
    return (
      <LinearGradient
        colors={[gradients.error.start, gradients.error.end]}
        start={{x: 0.5, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.outer, style]}>
        {inner}
      </LinearGradient>
    )
  }
  return <View style={[styles.outer, style]}>{inner}</View>
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red1,
    borderWidth: 1,
    borderColor: colors.red3,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  errorIcon: {
    backgroundColor: colors.red4,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  darkErrorIcon: {
    backgroundColor: colors.white,
  },
  message: {
    flex: 1,
    color: colors.red4,
    paddingRight: 10,
  },
  darkMessage: {
    color: colors.white,
    fontWeight: '600',
  },
  btn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
})
