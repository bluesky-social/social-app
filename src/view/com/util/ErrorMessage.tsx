import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'

export function ErrorMessage({
  message,
  onPressTryAgain,
}: {
  message: string
  onPressTryAgain?: () => void
}) {
  return (
    <View style={styles.outer}>
      <View style={styles.errorIcon}>
        <FontAwesomeIcon
          icon="exclamation"
          style={{color: colors.white}}
          size={16}
        />
      </View>
      <Text style={styles.message}>{message}</Text>
      {onPressTryAgain && (
        <TouchableOpacity style={styles.btn} onPress={onPressTryAgain}>
          <FontAwesomeIcon
            icon="arrows-rotate"
            style={{color: colors.red4}}
            size={16}
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
  message: {
    flex: 1,
    color: colors.red4,
    paddingRight: 10,
  },
  btn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
})
