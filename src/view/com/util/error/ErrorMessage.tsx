import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useTheme} from '#/lib/ThemeContext'
import {Text} from '../text/Text'

export function ErrorMessage({
  message,
  numberOfLines,
  style,
  onPressTryAgain,
}: {
  message: string
  numberOfLines?: number
  style?: StyleProp<ViewStyle>
  onPressTryAgain?: () => void
}) {
  const theme = useTheme()
  const pal = usePalette('error')
  const {_} = useLingui()
  return (
    <View testID="errorMessageView" style={[styles.outer, pal.view, style]}>
      <View
        style={[styles.errorIcon, {backgroundColor: theme.palette.error.icon}]}>
        <FontAwesomeIcon
          icon="exclamation"
          style={pal.text as FontAwesomeIconStyle}
          size={16}
        />
      </View>
      <Text
        type="sm-medium"
        style={[styles.message, pal.text]}
        numberOfLines={numberOfLines}>
        {message}
      </Text>
      {onPressTryAgain && (
        <TouchableOpacity
          testID="errorMessageTryAgainButton"
          style={styles.btn}
          onPress={onPressTryAgain}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Retry`)}
          accessibilityHint={_(
            msg`Retries the last action, which errored out`,
          )}>
          <FontAwesomeIcon
            icon="arrows-rotate"
            style={{color: theme.palette.error.icon}}
            size={18}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  errorIcon: {
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  message: {
    flex: 1,
    paddingRight: 10,
  },
  btn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
})
