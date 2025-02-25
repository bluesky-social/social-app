import {useMemo} from 'react'
import {ComAtprotoModerationDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export interface ReportOption {
  reason: string
  title: string
  description: string
}

interface ReportOptions {
  account: ReportOption[]
  post: ReportOption[]
  list: ReportOption[]
  starterPack: ReportOption[]
  feed: ReportOption[]
  chatMessage: ReportOption[]
}

export function useReportOptions(): ReportOptions {
  const {_} = useLingui()

  return useMemo(() => {
    const other = {
      reason: ComAtprotoModerationDefs.REASONOTHER,
      title: _(msg`Other`),
      description: _(msg`An issue not included in these options`),
    }
    const common = [
      {
        reason: ComAtprotoModerationDefs.REASONRUDE,
        title: _(msg`Anti-Social Behavior`),
        description: _(msg`Harassment, trolling, or intolerance`),
      },
      {
        reason: ComAtprotoModerationDefs.REASONVIOLATION,
        title: _(msg`Illegal and Urgent`),
        description: _(msg`Glaring violations of law or terms of service`),
      },
      other,
    ]
    return {
      account: [
        {
          reason: ComAtprotoModerationDefs.REASONMISLEADING,
          title: _(msg`Misleading Account`),
          description: _(
            msg`Impersonation or false claims about identity or affiliation`,
          ),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSPAM,
          title: _(msg`Frequently Posts Unwanted Content`),
          description: _(msg`Spam; excessive mentions or replies`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        other,
      ],
      post: [
        {
          reason: ComAtprotoModerationDefs.REASONMISLEADING,
          title: _(msg`Misleading Post`),
          description: _(msg`Impersonation, misinformation, or false claims`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSPAM,
          title: _(msg`Spam`),
          description: _(msg`Excessive mentions or replies`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSEXUAL,
          title: _(msg`Unwanted Sexual Content`),
          description: _(msg`Nudity or adult content not labeled as such`),
        },
        ...common,
      ],
      chatMessage: [
        {
          reason: ComAtprotoModerationDefs.REASONSPAM,
          title: _(msg`Spam`),
          description: _(msg`Excessive or unwanted messages`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSEXUAL,
          title: _(msg`Unwanted Sexual Content`),
          description: _(msg`Inappropriate messages or explicit links`),
        },
        ...common,
      ],
      list: [
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        ...common,
      ],
      starterPack: [
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        ...common,
      ],
      feed: [
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        ...common,
      ],
    }
  }, [_])
}
