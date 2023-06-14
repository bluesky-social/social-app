import React from 'react'
import LinearGradient from 'react-native-linear-gradient'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {Text} from '../../util/text/Text'
import {s, gradients, colors} from 'lib/styles'

export function SendReportButton({
  onPress,
  isProcessing,
}: {
  onPress: () => void
  isProcessing: boolean
}) {
  // loading state
  // =
  if (isProcessing) {
    return (
      <View style={[styles.btn, s.mt10]}>
        <ActivityIndicator />
      </View>
    )
  }
  return (
    <TouchableOpacity
      testID="sendReportBtn"
      style={s.mt10}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Report post"
      accessibilityHint={`Reports post with reason and details`}>
      <LinearGradient
        colors={[gradients.blueLight.start, gradients.blueLight.end]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.btn]}>
        <Text style={[s.white, s.bold, s.f18]}>Send Report</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
})
