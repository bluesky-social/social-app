import {View} from 'react-native'
import React, {useMemo} from 'react'
import {AtUri, ComAtprotoModerationDefs} from '@atproto/api'

import {Text} from '../../util/text/Text'
import {UsePaletteValue, usePalette} from 'lib/hooks/usePalette'
import {RadioGroup, RadioGroupItem} from 'view/com/util/forms/RadioGroup'

// This is mostly just content copy without almost any logic
// so this may grow over time and it makes sense to split it up into its own file
// to keep it separate from the actual reporting modal logic
const useReportRadioOptions = (pal: UsePaletteValue, atUri: AtUri | null) =>
  useMemo(() => {
    // If no atUri is passed, that means the reporting collection is account
    if (!atUri) {
      return [
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
        {
          key: ComAtprotoModerationDefs.REASONVIOLATION,
          label: (
            <View>
              <Text style={pal.text} type="md-bold">
                Name or Description Violates Community Standards
              </Text>
              <Text style={pal.textLight}>
                Terms used violate community standards
              </Text>
            </View>
          ),
        },
      ]
    }
    return [
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
    ]
  }, [pal, atUri])

//   TODO: More fitting options for reporting list and feedgen
export const ReportReasonOptions = ({
  atUri,
  selectedIssue,
  onSelectIssue,
}: {
  atUri: AtUri | null
  selectedIssue?: string
  onSelectIssue: (key: string) => void
}) => {
  const pal = usePalette('default')
  const ITEMS: RadioGroupItem[] = useReportRadioOptions(pal, atUri)
  return (
    <RadioGroup
      items={ITEMS}
      onSelect={onSelectIssue}
      testID="reportReasonRadios"
      initialSelection={selectedIssue}
    />
  )
}
