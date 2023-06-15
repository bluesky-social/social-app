import React, {useState, useMemo} from 'react'
import {TouchableOpacity, StyleSheet, View} from 'react-native'
import {ComAtprotoModerationDefs} from '@atproto/api'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {RadioGroup, RadioGroupItem} from '../../util/forms/RadioGroup'
import {Text} from '../../util/text/Text'
import * as Toast from '../../util/Toast'
import {ErrorMessage} from '../../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {SendReportButton} from './SendReportButton'
import {InputIssueDetails} from './InputIssueDetails'

export const snapPoints = [400]

export function Component({did}: {did: string}) {
  const store = useStores()
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>()
  const [issue, setIssue] = useState<string>()
  const onSelectIssue = (v: string) => setIssue(v)
  const [details, setDetails] = useState<string>()
  const [showDetailsInput, setShowDetailsInput] = useState(false)

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
  const goToDetails = () => {
    setShowDetailsInput(true)
  }

  return (
    <View testID="reportAccountModal" style={[styles.container, pal.view]}>
      {showDetailsInput ? (
        <InputIssueDetails
          submitReport={onPress}
          setDetails={setDetails}
          details={details}
          isProcessing={isProcessing}
          goBack={goBack}
        />
      ) : (
        <SelectIssue
          onPress={onPress}
          onSelectIssue={onSelectIssue}
          error={error}
          isProcessing={isProcessing}
          goToDetails={goToDetails}
        />
      )}
    </View>
  )
}

const SelectIssue = ({
  onPress,
  onSelectIssue,
  error,
  isProcessing,
  goToDetails,
}: {
  onPress: () => void
  onSelectIssue: (v: string) => void
  error: string | undefined
  isProcessing: boolean
  goToDetails: () => void
}) => {
  const pal = usePalette('default')
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
  return (
    <>
      <Text type="title-xl" style={[pal.text, styles.title]}>
        Report Account
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
      <SendReportButton onPress={onPress} isProcessing={isProcessing} />
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
  addDetailsBtn: {
    padding: 14,
    alignSelf: 'center',
  },
})
