import {View} from 'react-native'
import React, {useMemo} from 'react'
import {AtUri, ComAtprotoModerationDefs} from '@atproto/api'

import {Text} from '../../util/text/Text'
import {UsePaletteValue, usePalette} from 'lib/hooks/usePalette'
import {RadioGroup, RadioGroupItem} from 'view/com/util/forms/RadioGroup'
import {CollectionId} from './types'
import {t} from '@lingui/macro'

type ReasonMap = Record<string, {title: string; description: string}>
const CommonReasons = {
  [ComAtprotoModerationDefs.REASONRUDE]: {
    title: t`Anti-Social Behavior`,
    description: t`Harassment, trolling, or intolerance`,
  },
  [ComAtprotoModerationDefs.REASONVIOLATION]: {
    title: t`Illegal and Urgent`,
    description: t`Glaring violations of law or terms of service`,
  },
  [ComAtprotoModerationDefs.REASONOTHER]: {
    title: t`Other`,
    description: t`An issue not included in these options`,
  },
}
const CollectionToReasonsMap: Record<string, ReasonMap> = {
  [CollectionId.Post]: {
    [ComAtprotoModerationDefs.REASONSPAM]: {
      title: t`Spam`,
      description: t`Excessive mentions or replies`,
    },
    [ComAtprotoModerationDefs.REASONSEXUAL]: {
      title: t`Unwanted Sexual Content`,
      description: t`Nudity or pornography not labeled as such`,
    },
    __copyright__: {
      title: t`Copyright Violation`,
      description: t`Contains copyrighted material`,
    },
    ...CommonReasons,
  },
  [CollectionId.List]: {
    ...CommonReasons,
    [ComAtprotoModerationDefs.REASONVIOLATION]: {
      title: t`Name or Description Violates Community Standards`,
      description: t`Terms used violate community standards`,
    },
  },
}
const AccountReportReasons = {
  [ComAtprotoModerationDefs.REASONMISLEADING]: {
    title: t`Misleading Account`,
    description: t`Impersonation or false claims about identity or affiliation`,
  },
  [ComAtprotoModerationDefs.REASONSPAM]: {
    title: t`Frequently Posts Unwanted Content`,
    description: t`Spam; excessive mentions or replies`,
  },
  [ComAtprotoModerationDefs.REASONVIOLATION]: {
    title: t`Name or Description Violates Community Standards`,
    description: t`Terms used violate community standards`,
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
