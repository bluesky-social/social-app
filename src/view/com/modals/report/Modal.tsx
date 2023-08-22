import React, {useState, useMemo} from 'react'
import {Linking, StyleSheet, TouchableOpacity, View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AtUri} from '@atproto/api'
import {useStores} from 'state/index'
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

const DMCA_LINK = 'https://bsky.app/support/copyright'

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
  const store = useStores()
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetailsInput, setShowDetailsInput] = useState(false)
  const [error, setError] = useState<string>()
  const [issue, setIssue] = useState<string>()
  const [details, setDetails] = useState<string>()
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
        return
      }
      const $type = !isAccountReport
        ? 'com.atproto.repo.strongRef'
        : 'com.atproto.admin.defs#repoRef'
      await store.agent.createModerationReport({
        reasonType: issue,
        subject: {
          $type,
          ...content,
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
    setShowDetailsInput(false)
  }

  return (
    <ScrollView testID="reportModal" style={[s.flex1, pal.view]}>
      <View style={styles.container}>
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
      <Text style={[pal.text, styles.title]}>Report {collectionName}</Text>
      <Text style={[pal.textLight, styles.description]}>
        What is the issue with this {collectionName}?
      </Text>
      <ReportReasonOptions
        atUri={atUri}
        selectedIssue={issue}
        onSelectIssue={onSelectIssue}
      />
      {error ? (
        <View style={s.mt10}>
          <ErrorMessage message={error} />
        </View>
      ) : undefined}
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
