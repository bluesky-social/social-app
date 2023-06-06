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
import {TextInput} from './util'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CharProgress} from '../composer/char-progress/CharProgress'

const DMCA_LINK = 'https://bsky.app/support/copyright'

export const snapPoints = ['70%']

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
    <View testID="reportPostModal" style={[s.flex1, s.pl10, s.pr10, pal.view]}>
      {showTextInput ? (
        <InputIssueText
          details={details}
          setDetails={setDetails}
          setShowTextInput={setShowTextInput}
          submitReport={submitReport}
        />
      ) : (
        <SelectIssue
          setShowTextInput={setShowTextInput}
          error={error}
          issue={issue}
          setIssue={setIssue}
          submitReport={submitReport}
        />
      )}
    </View>
  )
}

const SelectIssue = ({
  error,
  setShowTextInput,
  issue,
  setIssue,
  submitReport,
}: {
  error: string | undefined
  setShowTextInput: (v: boolean) => void
  issue: string | undefined
  setIssue: (v: string) => void
  submitReport: () => void
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
          <SubmitReportButton onPress={submitReport} />
          <TouchableOpacity
            testID="addDetailsBtn"
            style={[s.mt10, s.mb10, s.alignCenter]}
            onPress={goToDetails}
            accessibilityRole="button"
            accessibilityLabel="Add details"
            accessibilityHint="Add more details to your report">
            <Text style={[pal.text, s.f18, pal.link]}>
              Add details to report
            </Text>
          </TouchableOpacity>
        </>
      ) : undefined}
    </>
  )
}

const InputIssueText = ({
  details,
  setDetails,
  setShowTextInput,
  submitReport,
}: {
  details: string | undefined
  setDetails: (v: string) => void
  setShowTextInput: (v: boolean) => void
  submitReport: () => void
}) => {
  const pal = usePalette('default')

  const goBack = () => {
    setShowTextInput(false)
  }

  return (
    <View style={[styles.detailsContainer]}>
      <TouchableOpacity
        testID="addDetailsBtn"
        style={[s.mt10, s.mb10, styles.backBtn]}
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Add details"
        accessibilityHint="Add more details to your report">
        <FontAwesomeIcon size={18} icon="angle-left" style={[pal.link]} />
        <Text style={[pal.text, s.f18, pal.link]}> Back</Text>
      </TouchableOpacity>
      <View style={[pal.btn, styles.detailsInputContainer]}>
        <TextInput
          accessibilityLabel="Text input field"
          accessibilityHint="Enter a reason for reporting this post."
          placeholder="Enter a reason or any other details here."
          placeholderTextColor={pal.textLight.color}
          value={details}
          onChangeText={setDetails}
          autoFocus={true}
          numberOfLines={3}
          multiline={true}
          textAlignVertical="top"
          maxLength={300}
          style={[styles.detailsInput]}
        />
        <View style={[styles.charProgress]}>
          <CharProgress count={details?.length || 0} />
        </View>
      </View>
      <SubmitReportButton onPress={submitReport} />
    </View>
  )
}

const SubmitReportButton = ({onPress}: {onPress: () => void}) => {
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
  detailsContainer: {
    marginTop: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsInputContainer: {
    borderRadius: 8,
  },
  detailsInput: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 8,
    minHeight: 100,
  },
  charProgress: {alignSelf: 'flex-end', marginRight: 2, marginBottom: 6},
})
