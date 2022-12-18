import React, {useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from '../../../state'
import {s, colors, gradients} from '../../lib/styles'
import {RadioGroup, RadioGroupItem} from '../util/forms/RadioGroup'
import {ErrorMessage} from '../util/ErrorMessage'

const ITEMS: RadioGroupItem[] = [
  {key: 'spam', label: 'Spam or excessive repeat posts'},
  {key: 'abuse', label: 'Abusive, rude, or hateful'},
  {key: 'copyright', label: 'Contains copyrighted material'},
  {key: 'illegal', label: 'Contains illegal content'},
]

export const snapPoints = ['50%']

export function Component({postUrl}: {postUrl: string}) {
  const store = useStores()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [issue, setIssue] = useState<string>('')
  const onSelectIssue = (v: string) => setIssue(v)
  const onPress = async () => {
    setError('')
    setIsProcessing(true)
    try {
      // TODO
      store.shell.closeModal()
      return
    } catch (e: any) {
      setError(e.toString())
      setIsProcessing(false)
    }
  }
  return (
    <View style={[s.flex1, s.pl10, s.pr10]}>
      <Text style={styles.title}>Report post</Text>
      <Text style={styles.description}>What is the issue with this post?</Text>
      <RadioGroup items={ITEMS} onSelect={onSelectIssue} />
      {error ? (
        <View style={s.mt10}>
          <ErrorMessage message={error} />
        </View>
      ) : undefined}
      {isProcessing ? (
        <View style={[styles.btn, s.mt10]}>
          <ActivityIndicator />
        </View>
      ) : issue ? (
        <TouchableOpacity style={s.mt10} onPress={onPress}>
          <LinearGradient
            colors={[gradients.primary.start, gradients.primary.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text style={[s.white, s.bold, s.f18]}>Send Report</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : undefined}
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
