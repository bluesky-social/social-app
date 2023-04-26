import React, {useState, useMemo} from 'react'
import {
  ActivityIndicator,
  Linking,
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

const DMCA_LINK = 'https://bsky.app/support/copyright'

export const snapPoints = [500]

export function Component({
  postUri,
  postCid,
}: {
  postUri: string
  postCid: string
}) {
  const store = useStores()
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [issue, setIssue] = useState<string>('')
  const onSelectIssue = (v: string) => setIssue(v)

  const ITEMS: RadioGroupItem[] = useMemo(
    () => [
      {
        key: ComAtprotoModerationDefs.REASONSPAM,
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Spam
            </Text>
            <Text style={pal.textLight}>Excessive mentions or replies</Text>
          </View>
        ),
      },
      {
        key: ComAtprotoModerationDefs.REASONSEXUAL,
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Unwanted Sexual Content
            </Text>
            <Text style={pal.textLight}>
              Nudity or pornography not labeled as such
            </Text>
          </View>
        ),
      },
      {
        key: '__copyright__',
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Copyright Violation
            </Text>
            <Text style={pal.textLight}>Contains copyrighted material</Text>
          </View>
        ),
      },
      {
        key: ComAtprotoModerationDefs.REASONVIOLATION,
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Illegal and Urgent
            </Text>
            <Text style={pal.textLight}>
              Glaring violations of law or terms of service
            </Text>
          </View>
        ),
      },
      {
        key: ComAtprotoModerationDefs.REASONOTHER,
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Other
            </Text>
            <Text style={pal.textLight}>
              An issue not included in these options
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
      if (issue === '__copyright__') {
        Linking.openURL(DMCA_LINK)
      } else {
        await store.agent.createModerationReport({
          reasonType: issue,
          subject: {
            $type: 'com.atproto.repo.strongRef',
            uri: postUri,
            cid: postCid,
          },
        })
        Toast.show("Thank you for your report! We'll look into it promptly.")
      }
      store.shell.closeModal()
      return
    } catch (e: any) {
      setError(cleanError(e))
      setIsProcessing(false)
    }
  }
  return (
    <View testID="reportPostModal" style={[s.flex1, s.pl10, s.pr10, pal.view]}>
      <Text style={[pal.text, styles.title]}>Report post</Text>
      <Text style={[pal.textLight, styles.description]}>
        What is the issue with this post?
      </Text>
      <RadioGroup
        testID="reportPostRadios"
        items={ITEMS}
        onSelect={onSelectIssue}
      />
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
