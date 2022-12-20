import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from './Text'
import {colors} from '../../lib/styles'

export function ErrorScreen({
  title,
  message,
  details,
  onPressTryAgain,
}: {
  title: string
  message: string
  details?: string
  onPressTryAgain?: () => void
}) {
  return (
    <View style={styles.outer}>
      <View style={styles.errorIconContainer}>
        <View style={styles.errorIcon}>
          <FontAwesomeIcon
            icon="exclamation"
            style={{color: colors.white}}
            size={24}
          />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {details && <Text style={styles.details}>{details}</Text>}
      {onPressTryAgain && (
        <View style={styles.btnContainer}>
          <TouchableOpacity style={styles.btn} onPress={onPressTryAgain}>
            <FontAwesomeIcon
              icon="arrows-rotate"
              style={{color: colors.white}}
              size={16}
            />
            <Text style={styles.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.red1,
    borderWidth: 1,
    borderColor: colors.red3,
    borderRadius: 6,
    paddingVertical: 30,
    paddingHorizontal: 14,
    margin: 10,
  },
  title: {
    textAlign: 'center',
    color: colors.red4,
    fontSize: 24,
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    color: colors.red4,
    marginBottom: 20,
  },
  details: {
    textAlign: 'center',
    color: colors.black,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray5,
    borderRadius: 6,
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
    backgroundColor: colors.red4,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: {
    marginLeft: 5,
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  errorIcon: {
    backgroundColor: colors.red4,
    borderRadius: 30,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
})
