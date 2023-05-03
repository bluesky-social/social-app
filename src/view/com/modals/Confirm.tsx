import React, {useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'

export const snapPoints = ['50%']

export function Component({
  title,
  message,
  onPressConfirm,
}: {
  title: string
  message: string | (() => JSX.Element)
  onPressConfirm: () => void | Promise<void>
}) {
  const pal = usePalette('default')
  const store = useStores()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const onPress = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await onPressConfirm()
      store.shell.closeModal()
      return
    } catch (e: any) {
      setError(cleanError(e))
      setIsProcessing(false)
    }
  }
  return (
    <View testID="confirmModal" style={[pal.view, styles.container]}>
      <Text type="title-xl" style={[pal.text, styles.title]}>
        {title}
      </Text>
      {typeof message === 'string' ? (
        <Text type="xl" style={[pal.textLight, styles.description]}>
          {message}
        </Text>
      ) : (
        message()
      )}
      {error ? (
        <View style={s.mt10}>
          <ErrorMessage message={error} />
        </View>
      ) : undefined}
      <View style={s.flex1} />
      {isProcessing ? (
        <View style={[styles.btn, s.mt10]}>
          <ActivityIndicator />
        </View>
      ) : (
        <TouchableOpacity
          testID="confirmBtn"
          onPress={onPress}
          style={[styles.btn]}
          accessibilityRole="button"
          accessibilityLabel="Confirm"
          // TODO: This needs to be updated so that modal roles are clear;
          // Currently there is only one usage for the confirm modal: post deletion
          accessibilityHint="Confirms a potentially destructive action">
          <Text style={[s.white, s.bold, s.f18]}>Confirm</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingBottom: isDesktopWeb ? 0 : 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    marginTop: 22,
    marginHorizontal: 44,
    backgroundColor: colors.blue3,
  },
})
