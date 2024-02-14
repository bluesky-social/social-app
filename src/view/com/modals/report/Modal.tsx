import React, {useState, useMemo} from 'react'
import {Linking, StyleSheet, TouchableOpacity, View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AtUri} from '@atproto/api'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s} from 'lib/styles'
import {Text} from '../../util/text/Text'
import * as Toast from '../../util/Toast'
import {ErrorMessage} from '../../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {SendReportButton} from './SendReportButton'
import {InputIssueDetails} from './InputIssueDetails'
import {ReportReasonOptions} from './ReasonOptions'
import {CollectionId} from './types'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {getAgent} from '#/state/session'

const DMCA_LINK = 'https://bsky.social/about/support/copyright'

export const snapPoints = [575]

const CollectionNames = {
  [CollectionId.FeedGenerator]: 'Feed',
  [CollectionId.Profile]: 'Profile',
  [CollectionId.List]: 'List',
  [CollectionId.Post]: 'Post',
}

type ReportComponentProps =
  | {
      uri: string
      cid: string
    }
  | {
      did: string
    }

export function Component(content: ReportComponentProps) {
  const {closeModal} = useModalControls()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetailsInput, setShowDetailsInput] = useState(false)
  const [error, setError] = useState<string>('')
  const [issue, setIssue] = useState<string>('')
  const [details, setDetails] = useState<string>('')
  const isAccountReport = 'did' in content
  const subjectKey = isAccountReport ? content.did : content.uri
  const atUri = useMemo(
    () => (!isAccountReport ? new AtUri(subjectKey) : null),
    [isAccountReport, subjectKey],
  )

  const submitReport = async () => {
    setError('')
    if (!issue) {
      return
    }
    setIsProcessing(true)
    try {
      if (issue === '__copyright__') {
        Linking.openURL(DMCA_LINK)
        closeModal()
        return
      }
      const $type = !isAccountReport
        ? 'com.atproto.repo.strongRef'
        : 'com.atproto.admin.defs#repoRef'
      await getAgent().createModerationReport({
        reasonType: issue,
        subject: {
          $type,
          ...content,
        },
        reason: details,
      })
      Toast.show("Thank you for your report! We'll look into it promptly.")

      closeModal()
      return
    } catch (e: any) {
      setError(cleanError(e))
      setIsProcessing(false)
    }
  }

  const goBack = () => {
    setShowDetailsInput(false)
  }

  return (
    <ScrollView testID="reportModal" style={[s.flex1, pal.view]}>
      <View
        style={[
          styles.container,
          isMobile && {
            paddingBottom: 40,
          },
        ]}>
        {showDetailsInput ? (
          <InputIssueDetails
            details={details}
            setDetails={setDetails}
            goBack={goBack}
            submitReport={submitReport}
            isProcessing={isProcessing}
          />
        ) : (
          <SelectIssue
            setShowDetailsInput={setShowDetailsInput}
            error={error}
            issue={issue}
            setIssue={setIssue}
            submitReport={submitReport}
            isProcessing={isProcessing}
            atUri={atUri}
          />
        )}
      </View>
    </ScrollView>
  )
}

// If no atUri is passed, that means the reporting collection is account
const getCollectionNameForReport = (atUri: AtUri | null) => {
  if (!atUri) return 'Account'
  // Generic fallback for any collection being reported
  return CollectionNames[atUri.collection as CollectionId] || 'Content'
}

const SelectIssue = ({
  error,
  setShowDetailsInput,
  issue,
  setIssue,
  submitReport,
  isProcessing,
  atUri,
}: {
  error: string | undefined
  setShowDetailsInput: (v: boolean) => void
  issue: string | undefined
  setIssue: (v: string) => void
  submitReport: () => void
  isProcessing: boolean
  atUri: AtUri | null
}) => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const collectionName = getCollectionNameForReport(atUri)
  const onSelectIssue = (v: string) => setIssue(v)
  const goToDetails = () => {
    if (issue === '__copyright__') {
      Linking.openURL(DMCA_LINK)
      return
    }
    setShowDetailsInput(true)
  }

  return (
    <>
      <Text style={[pal.text, styles.title]}>
        <Trans>Report {collectionName}</Trans>
      </Text>
      <Text style={[pal.textLight, styles.description]}>
        <Trans>What is the issue with this {collectionName}?</Trans>
      </Text>
      <View style={{marginBottom: 10}}>
        <ReportReasonOptions
          atUri={atUri}
          selectedIssue={issue}
          onSelectIssue={onSelectIssue}
        />
      </View>
      {error ? <ErrorMessage message={error} /> : undefined}
      {/* If no atUri is present, the report would be for account in which case, we allow sending without specifying a reason */}
      {issue || !atUri ? (
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
            accessibilityLabel={_(msg`Add details`)}
            accessibilityHint="Add more details to your report">
            <Text style={[s.f18, pal.link]}>
              <Trans>Add details to report</Trans>
            </Text>
          </TouchableOpacity>
        </>
      ) : undefined}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
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
