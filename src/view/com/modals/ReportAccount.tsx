import React, {useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {ComAtprotoReportReasonType} from '@atproto/api'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import {s, colors, gradients} from 'lib/styles'
import {RadioGroup, RadioGroupItem} from '../util/forms/RadioGroup'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'

const ITEMS: RadioGroupItem[] = [
  {key: 'spam', label: 'Spam or excessive repeat posts'},
  {key: 'abuse', label: 'Abusive, rude, or hateful'},
  {key: 'illegal', label: 'Posts illegal content'},
]

export const snapPoints = ['50%']

export function Component({did}: {did: string}) {
  const store = useStores()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [issue, setIssue] = useState<string>('')
  const onSelectIssue = (v: string) => setIssue(v)
  const onPress = async () => {
    setError('')
    if (!issue) {
      return
    }
    setIsProcessing(true)
    try {
      // NOTE: we should update the lexicon of reasontype to include more options -prf
      let reasonType = ComAtprotoReportReasonType.OTHER
      if (issue === 'spam') {
        reasonType = ComAtprotoReportReasonType.SPAM
      }
      const reason = ITEMS.find(item => item.key === issue)?.label || ''
      await store.api.com.atproto.report.create({
        reasonType,
        reason,
        subject: {
          $type: 'com.atproto.repo.repoRef',
          did,
        },
      })
      Toast.show("Thank you for your report! We'll look into it promptly.")
      store.shell.closeModal()
      return
    } catch (e: any) {
      setError(cleanError(e))
      setIsProcessing(false)
    }
  }
  return (
    <View style={[s.flex1, s.pl10, s.pr10]}>
      <Text style={styles.title}>Report account</Text>
      <Text style={styles.description}>
        What is the issue with this account?
      </Text>
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
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
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
