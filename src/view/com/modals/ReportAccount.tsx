import React, {useState, useMemo} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {ComAtprotoModerationDefs} from '@atproto/api'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import {s, colors, gradients} from 'lib/styles'
import {RadioGroup, RadioGroupItem} from '../util/forms/RadioGroup'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'

export const snapPoints = ['50%']

export function Component({did}: {did: string}) {
  const store = useStores()
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [issue, setIssue] = useState<string>('')
  const onSelectIssue = (v: string) => setIssue(v)

  const ITEMS: RadioGroupItem[] = useMemo(
    () => [
      {
        key: ComAtprotoModerationDefs.REASONMISLEADING,
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Misleading Account
            </Text>
            <Text style={pal.textLight}>
              Impersonation or false claims about identity or affiliation
            </Text>
          </View>
        ),
      },
      {
        key: ComAtprotoModerationDefs.REASONSPAM,
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Frequently Posts Unwanted Content
            </Text>
            <Text style={pal.textLight}>
              Spam; excessive mentions or replies
            </Text>
          </View>
        ),
      },
    ],
    [pal],
  )

  const onPress = async () => {
    setError('')
    if (!issue) {
      return
    }
    setIsProcessing(true)
    try {
      await store.agent.com.atproto.moderation.createReport({
        reasonType: issue,
        subject: {
          $type: 'com.atproto.admin.defs#repoRef',
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
    <View testID="reportAccountModal" style={[styles.container, pal.view]}>
      <Text type="title-xl" style={[pal.text, styles.title]}>
        Report account
      </Text>
      <Text type="xl" style={[pal.text, styles.description]}>
        What is the issue with this account?
      </Text>
      <RadioGroup
        testID="reportAccountRadios"
        items={ITEMS}
        onSelect={onSelectIssue}
      />
      <Text type="sm" style={[pal.text, styles.description, s.pt10]}>
        For other issues, please report specific posts.
      </Text>
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
        <TouchableOpacity
          testID="sendReportBtn"
          style={s.mt10}
          onPress={onPress}>
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
  container: {
    flex: 1,
    paddingHorizontal: isDesktopWeb ? 0 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
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
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
})
