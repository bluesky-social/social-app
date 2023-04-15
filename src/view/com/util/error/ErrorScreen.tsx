import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {CenteredView} from '../Views'

export function ErrorScreen({
  title,
  message,
  details,
  onPressTryAgain,
  testID,
}: {
  title: string
  message: string
  details?: string
  onPressTryAgain?: () => void
  testID?: string
}) {
  const theme = useTheme()
  const pal = usePalette('error')
  return (
    <CenteredView testID={testID} style={[styles.outer, pal.view]}>
      <View style={styles.errorIconContainer}>
        <View
          style={[
            styles.errorIcon,
            {backgroundColor: theme.palette.error.icon},
          ]}>
          <FontAwesomeIcon
            icon="exclamation"
            style={{color: colors.white}}
            size={24}
          />
        </View>
      </View>
      <Text type="title-lg" style={[styles.title, pal.text]}>
        {title}
      </Text>
      <Text style={[styles.message, pal.textLight]}>{message}</Text>
      {details && (
        <Text
          testID={`${testID}-details`}
          type="sm"
          style={[
            styles.details,
            pal.textInverted,
            {backgroundColor: theme.palette.default.background},
          ]}>
          {details}
        </Text>
      )}
      {onPressTryAgain && (
        <View style={styles.btnContainer}>
          <TouchableOpacity
            testID="errorScreenTryAgainButton"
            style={[styles.btn, {backgroundColor: theme.palette.error.icon}]}
            onPress={onPressTryAgain}>
            <FontAwesomeIcon
              icon="arrows-rotate"
              style={pal.text as FontAwesomeIconStyle}
              size={16}
            />
            <Text type="button" style={[styles.btnText, pal.text]}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </CenteredView>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    paddingVertical: 30,
    paddingHorizontal: 14,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  details: {
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  btnContainer: {
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: {
    marginLeft: 5,
  },
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  errorIcon: {
    borderRadius: 30,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
})
