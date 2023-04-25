import React from 'react'
import {StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {Button} from '../forms/Button'
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
  const pal = usePalette('default')
  return (
    <CenteredView testID={testID} style={[styles.outer, pal.view]}>
      <View style={styles.errorIconContainer}>
        <View
          style={[
            styles.errorIcon,
            {backgroundColor: theme.palette.inverted.background},
          ]}>
          <FontAwesomeIcon
            icon="exclamation"
            style={pal.textInverted}
            size={24}
          />
        </View>
      </View>
      <Text type="title-lg" style={[styles.title, pal.text]}>
        {title}
      </Text>
      <Text style={[styles.message, pal.text]}>{message}</Text>
      {details && (
        <Text
          testID={`${testID}-details`}
          style={[styles.details, pal.text, pal.viewLight]}>
          {details}
        </Text>
      )}
      {onPressTryAgain && (
        <View style={styles.btnContainer}>
          <Button
            testID="errorScreenTryAgainButton"
            type="default"
            style={[styles.btn]}
            onPress={onPressTryAgain}>
            <FontAwesomeIcon
              icon="arrows-rotate"
              style={pal.link as FontAwesomeIconStyle}
              size={16}
            />
            <Text type="button" style={[styles.btnText, pal.link]}>
              Try again
            </Text>
          </Button>
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
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
