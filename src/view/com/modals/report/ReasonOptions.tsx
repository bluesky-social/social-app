import {View} from 'react-native'
import React, {useMemo} from 'react'
import {AtUri, ComAtprotoModerationDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {Text} from '../../util/text/Text'
import {UsePaletteValue, usePalette} from 'lib/hooks/usePalette'
import {RadioGroup, RadioGroupItem} from 'view/com/util/forms/RadioGroup'
import {CollectionId} from './types'

type ReasonMap = Record<string, {title: JSX.Element; description: JSX.Element}>
const CommonReasons = {
  [ComAtprotoModerationDefs.REASONRUDE]: {
    title: <Trans>Anti-Social Behavior</Trans>,
    description: <Trans>Harassment, trolling, or intolerance</Trans>,
  },
  [ComAtprotoModerationDefs.REASONVIOLATION]: {
    title: <Trans>Illegal and Urgent</Trans>,
    description: <Trans>Glaring violations of law or terms of service</Trans>,
  },
  [ComAtprotoModerationDefs.REASONOTHER]: {
    title: <Trans>Other</Trans>,
    description: <Trans>An issue not included in these options</Trans>,
  },
}
const CollectionToReasonsMap: Record<string, ReasonMap> = {
  [CollectionId.Post]: {
    [ComAtprotoModerationDefs.REASONSPAM]: {
      title: <Trans>Spam</Trans>,
      description: <Trans>Excessive mentions or replies</Trans>,
    },
    [ComAtprotoModerationDefs.REASONSEXUAL]: {
      title: <Trans>Unwanted Sexual Content</Trans>,
      description: <Trans>Nudity or pornography not labeled as such</Trans>,
    },
    __copyright__: {
      title: <Trans>Copyright Violation</Trans>,
      description: <Trans>Contains copyrighted material</Trans>,
    },
    ...CommonReasons,
  },
  [CollectionId.List]: {
    ...CommonReasons,
    [ComAtprotoModerationDefs.REASONVIOLATION]: {
      title: <Trans>Name or Description Violates Community Standards</Trans>,
      description: <Trans>Terms used violate community standards</Trans>,
    },
  },
}
const AccountReportReasons = {
  [ComAtprotoModerationDefs.REASONMISLEADING]: {
    title: <Trans>Misleading Account</Trans>,
    description: (
      <Trans>Impersonation or false claims about identity or affiliation</Trans>
    ),
  },
  [ComAtprotoModerationDefs.REASONSPAM]: {
    title: <Trans>Frequently Posts Unwanted Content</Trans>,
    description: <Trans>Spam; excessive mentions or replies</Trans>,
  },
  [ComAtprotoModerationDefs.REASONVIOLATION]: {
    title: <Trans>Name or Description Violates Community Standards</Trans>,
    description: <Trans>Terms used violate community standards</Trans>,
  },
}

const Option = ({
  pal,
  title,
  description,
}: {
  pal: UsePaletteValue
  description: string
  title: string
}) => {
  return (
    <View>
      <Text style={pal.text} type="md-bold">
        {title}
      </Text>
      <Text style={pal.textLight}>{description}</Text>
    </View>
  )
}

// This is mostly just content copy without almost any logic
// so this may grow over time and it makes sense to split it up into its own file
// to keep it separate from the actual reporting modal logic
const useReportRadioOptions = (pal: UsePaletteValue, atUri: AtUri | null) =>
  useMemo(() => {
    let items: ReasonMap = {...CommonReasons}
    // If no atUri is passed, that means the reporting collection is account
    if (!atUri) {
      items = {...AccountReportReasons}
    }

    if (atUri?.collection && CollectionToReasonsMap[atUri.collection]) {
      items = {...CollectionToReasonsMap[atUri.collection]}
    }

    return Object.entries(items).map(([key, {title, description}]) => ({
      key,
      label: <Option pal={pal} title={title} description={description} />,
    }))
  }, [pal, atUri])

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
