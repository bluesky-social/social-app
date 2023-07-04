import React, {useState, useMemo} from 'react'
import {Linking, StyleSheet, TouchableOpacity, View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {ComAtprotoModerationDefs} from '@atproto/api'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {RadioGroup, RadioGroupItem} from '../../util/forms/RadioGroup'
import {Text} from '../../util/text/Text'
import * as Toast from '../../util/Toast'
import {ErrorMessage} from '../../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {SendReportButton} from './SendReportButton'
import {InputIssueDetails} from './InputIssueDetails'

const DMCA_LINK = 'https://bsky.app/support/copyright'

export const snapPoints = [575]

export function Component({
  postUri,
  postCid,
}: {
  postUri: string
  postCid: string
}) {
  const store = useStores()
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [error, setError] = useState<string>()
  const [issue, setIssue] = useState<string>()
  const [details, setDetails] = useState<string>()

  const submitReport = async () => {
    setError('')
    if (!issue) {
      return
    }
    setIsProcessing(true)
    try {
      if (issue === '__copyright__') {
        Linking.openURL(DMCA_LINK)
        return
      }
      await store.agent.createModerationReport({
        reasonType: issue,
        subject: {
          $type: 'com.atproto.repo.strongRef',
          uri: postUri,
          cid: postCid,
        },
        reason: details,
      })
      Toast.show("Thank you for your report! We'll look into it promptly.")

      store.shell.closeModal()
      return
    } catch (e: any) {
      setError(cleanError(e))
      setIsProcessing(false)
    }
  }

  const goBack = () => {
    setShowTextInput(false)
  }

  return (
    <ScrollView testID="reportPostModal" style={[s.flex1, pal.view]}>
      <View style={styles.container}>
        {showTextInput ? (
          <InputIssueDetails
            details={details}
            setDetails={setDetails}
            goBack={goBack}
            submitReport={submitReport}
            isProcessing={isProcessing}
          />
        ) : (
          <SelectIssue
            setShowTextInput={setShowTextInput}
            error={error}
            issue={issue}
            setIssue={setIssue}
            submitReport={submitReport}
            isProcessing={isProcessing}
          />
        )}
      </View>
    </ScrollView>
  )
}

const SelectIssue = ({
  error,
  setShowTextInput,
  issue,
  setIssue,
  submitReport,
  isProcessing,
}: {
  error: string | undefined
  setShowTextInput: (v: boolean) => void
  issue: string | undefined
  setIssue: (v: string) => void
  submitReport: () => void
  isProcessing: boolean
}) => {
  const pal = usePalette('default')
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
        key: ComAtprotoModerationDefs.REASONRUDE,
        label: (
          <View>
            <Text style={pal.text} type="md-bold">
              Anti-Social Behavior
            </Text>
            <Text style={pal.textLight}>
              Harassment, trolling, or intolerance
            </Text>
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

  const onSelectIssue = (v: string) => setIssue(v)
  const goToDetails = () => {
    if (issue === '__copyright__') {
      Linking.openURL(DMCA_LINK)
      return
    }
    setShowTextInput(true)
  }

  return (
    <>
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
      {issue ? (
        <>
          <SendReportButton
            onPress={submitReport}
            isProcessing={isProcessing}
          />
          <TouchableOpacity
            testID="addDetailsBtn"
            style={styles.addDetailsBtn}
            onPress={goToDetails}
            accessibilityRole="button"
            accessibilityLabel="Add details"
            accessibilityHint="Add more details to your report">
            <Text style={[s.f18, pal.link]}>Add details to report</Text>
          </TouchableOpacity>
        </>
      ) : undefined}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
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
  addDetailsBtn: {
    padding: 14,
    alignSelf: 'center',
  },
})
