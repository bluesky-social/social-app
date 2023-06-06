import React from 'react'
import {View, TouchableOpacity, StyleSheet} from 'react-native'
import {TextInput} from '../util'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CharProgress} from '../../composer/char-progress/CharProgress'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {SendReportButton} from './SendReportButton'

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
          style={[styles.detailsInput, pal.text]}
        />
        <View style={[styles.charProgress]}>
          <CharProgress count={details?.length || 0} />
        </View>
      </View>
      <SendReportButton onPress={submitReport} isProcessing={isProcessing} />
    </View>
  )
}

const styles = StyleSheet.create({
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
