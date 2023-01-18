import React, {useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Text} from '../util/text/Text'
import {useStores} from '../../../state'
import {s, colors, gradients} from '../../lib/styles'
import {ErrorMessage} from '../util/error/ErrorMessage'

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
      setError(e.toString())
      setIsProcessing(false)
    }
  }
  return (
    <View style={[s.flex1, s.pl10, s.pr10]}>
      <Text style={styles.title}>{title}</Text>
      {typeof message === 'string' ? (
        <Text style={styles.description}>{message}</Text>
      ) : (
        message()
      )}
      {error ? (
        <View style={s.mt10}>
          <ErrorMessage message={error} />
        </View>
      ) : undefined}
      {isProcessing ? (
        <View style={[styles.btn, s.mt10]}>
          <ActivityIndicator />
        </View>
      ) : (
        <TouchableOpacity style={s.mt10} onPress={onPress}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text style={[s.white, s.bold, s.f18]}>Confirm</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    fontSize: 17,
    paddingHorizontal: 22,
    color: colors.gray5,
    marginBottom: 10,
  },
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
