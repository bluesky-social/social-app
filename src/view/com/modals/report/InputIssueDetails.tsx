import React from 'react'
import {View, TouchableOpacity, StyleSheet} from 'react-native'
import {TextInput} from '../util'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CharProgress} from '../../composer/char-progress/CharProgress'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s} from 'lib/styles'
import {SendReportButton} from './SendReportButton'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function InputIssueDetails({
  details,
  setDetails,
  goBack,
  submitReport,
  isProcessing,
}: {
  details: string | undefined
  setDetails: (v: string) => void
  goBack: () => void
  submitReport: () => void
  isProcessing: boolean
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()

  return (
    <View
      style={{
        marginTop: isMobile ? 12 : 0,
      }}>
      <TouchableOpacity
        testID="addDetailsBtn"
        style={[s.mb10, styles.backBtn]}
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Add details`)}
        accessibilityHint="Add more details to your report">
        <FontAwesomeIcon size={18} icon="angle-left" style={[pal.link]} />
        <Text style={[pal.text, s.f18, pal.link]}>
          {' '}
          <Trans>Back</Trans>
        </Text>
      </TouchableOpacity>
      <View style={[pal.btn, styles.detailsInputContainer]}>
        <TextInput
          accessibilityLabel={_(msg`Text input field`)}
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
          style={[styles.detailsInput, pal.text]}
        />
        <View style={styles.detailsInputBottomBar}>
          <View style={styles.charCounter}>
            <CharProgress count={details?.length || 0} />
          </View>
        </View>
      </View>
      <SendReportButton onPress={submitReport} isProcessing={isProcessing} />
    </View>
  )
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsInputContainer: {
    borderRadius: 8,
  },
  detailsInput: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 8,
    minHeight: 100,
    fontSize: 16,
  },
  detailsInputBottomBar: {
    alignSelf: 'flex-end',
  },
  charCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    paddingBottom: 8,
  },
})
