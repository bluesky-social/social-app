import {type ReasonType} from '@atproto/api/dist/client/types/com/atproto/moderation/defs'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export type ReportCategory =
  | 'childSafety'
  | 'violencePhysicalHarm'
  | 'sexualAdultContent'
  | 'harassmentHate'
  | 'misleading'
  | 'ruleBreaking'
  | 'civicIntegrity'
  | 'other'

export interface ReportOptionCategory {
  key: ReportCategory
  title: string
  description: string
  options: ReportOption[]
  sort: number
  isOther?: boolean
}

export interface ReportOptionCategories {
  childSafety: ReportOptionCategory
  violencePhysicalHarm: ReportOptionCategory
  sexualAdultContent: ReportOptionCategory
  harassmentHate: ReportOptionCategory
  misleading: ReportOptionCategory
  ruleBreaking: ReportOptionCategory
  civicIntegrity: ReportOptionCategory
  other: ReportOptionCategory
}

export interface ReportOption {
  title: string
  reason: ReasonType
}

export const OtherReportReasons = new Set<ReasonType | undefined>([
  'com.atproto.moderation.defs#reasonOther',
  'tools.ozone.report.defs#reasonChildSafetyOther',
  'tools.ozone.report.defs#reasonViolenceOther',
  'tools.ozone.report.defs#reasonSexualOther',
  'tools.ozone.report.defs#reasonHarassmentOther',
  'tools.ozone.report.defs#reasonMisleadingOther',
  'tools.ozone.report.defs#reasonRuleOther',
  'tools.ozone.report.defs#reasonChildSafetyOther',
])

export function useReportOptions() {
  const {_} = useLingui()

  const categories: ReportOptionCategories = {
    childSafety: {
      key: 'childSafety',
      title: _(msg`Child Safety`),
      description: _(
        msg`Content harming or endangering minors' safety and wellbeing`,
      ),
      sort: 1,
      options: [
        {
          title: _(msg`Child Sexual Abuse Material (CSAM)`),
          reason: 'tools.ozone.report.defs#reasonChildSafetyCSAM',
        },
        {
          title: _(msg`Grooming or Predatory Behavior`),
          reason: 'tools.ozone.report.defs#reasonChildSafetyGroom',
        },
        {
          title: _(msg`Minor Privacy Violation`),
          reason: 'tools.ozone.report.defs#reasonChildSafetyMinorPrivacy',
        },
        {
          title: _(msg`Child Endangerment`),
          reason: 'tools.ozone.report.defs#reasonChildSafetyEndangerment',
        },
        {
          title: _(msg`Minor Harassment or Bullying`),
          reason: 'tools.ozone.report.defs#reasonChildSafetyHarassment',
        },
        {
          title: _(msg`Promotion of Child Exploitation`),
          reason: 'tools.ozone.report.defs#reasonChildSafetyPromotion',
        },
        {
          title: _(msg`Other Child Safety Issue`),
          reason: 'tools.ozone.report.defs#reasonChildSafetyOther',
        },
      ],
    },
    violencePhysicalHarm: {
      key: 'violencePhysicalHarm',
      title: _(msg`Violence or Physical Harm`),
      sort: 2,
      description: _(msg`Threats, calls for violence, or graphic content`),
      options: [
        {
          title: _(msg`Animal Welfare`),
          reason: 'tools.ozone.report.defs#reasonViolenceAnimalWelfare',
        },
        {
          title: _(msg`Threats or Incitement`),
          reason: 'tools.ozone.report.defs#reasonViolenceThreats',
        },
        {
          title: _(msg`Graphic Violent Content`),
          reason: 'tools.ozone.report.defs#reasonViolenceGraphicContent',
        },
        {
          title: _(msg`Self Harm`),
          reason: 'tools.ozone.report.defs#reasonViolenceSelfHarm',
        },
        {
          title: _(msg`Glorification of Violence`),
          reason: 'tools.ozone.report.defs#reasonViolenceGlorification',
        },
        {
          title: _(msg`Extremist Content`),
          reason: 'tools.ozone.report.defs#reasonViolenceExtremistContent',
        },
        {
          title: _(msg`Human Trafficking`),
          reason: 'tools.ozone.report.defs#reasonViolenceTrafficking',
        },
        {
          title: _(msg`Other Violent Content`),
          reason: 'tools.ozone.report.defs#reasonViolenceOther',
        },
      ],
    },
    sexualAdultContent: {
      key: 'sexualAdultContent',
      title: _(msg`Sexual and Adult Content`),
      description: _(msg`Adult, child or animal sexual abuse`),
      sort: 3,
      options: [
        {
          title: _(msg`Adult Sexual Abuse Content`),
          reason: 'tools.ozone.report.defs#reasonSexualAbuseContent',
        },
        {
          title: _(msg`Non-Consensual Intimate Imagery`),
          reason: 'tools.ozone.report.defs#reasonSexualNCII',
        },
        {
          title: _(msg`SexualSextortion`),
          reason: 'tools.ozone.report.defs#reasonSexualSextortion',
        },
        {
          title: _(msg`Deepfake Adult Content`),
          reason: 'tools.ozone.report.defs#reasonSexualDeepfake',
        },
        {
          title: _(msg`Animal Sexual Abuse`),
          reason: 'tools.ozone.report.defs#reasonSexualAnimal',
        },
        {
          title: _(msg`Unlabelled Adult Content`),
          reason: 'tools.ozone.report.defs#reasonSexualUnlabeled',
        },
        {
          title: _(msg`Other Sexual Violence Content`),
          reason: 'tools.ozone.report.defs#reasonSexualOther',
        },
      ],
    },
    harassmentHate: {
      key: 'harassmentHate',
      title: _(msg`Harassment or Hate`),
      description: _(
        msg`Targeted attacks, hate speech, or organized harassment`,
      ),
      sort: 4,
      options: [
        {
          title: _(msg`Trolling`),
          reason: 'tools.ozone.report.defs#reasonHarassmentTroll',
        },
        {
          title: _(msg`Targeted Harassment`),
          reason: 'tools.ozone.report.defs#reasonHarassmentTargeted',
        },
        {
          title: _(msg`Hate Speech`),
          reason: 'tools.ozone.report.defs#reasonHarassmentHateSpeech',
        },
        {
          title: _(msg`Doxxing`),
          reason: 'tools.ozone.report.defs#reasonHarassmentDoxxing',
        },
        {
          title: _(msg`Other Harassing or Hateful Content`),
          reason: 'tools.ozone.report.defs#reasonHarassmentOther',
        },
      ],
    },
    misleading: {
      key: 'misleading',
      title: _(msg`Misleading`),
      description: _(msg`Spam, scams, false info or impersonation`),
      sort: 5,
      options: [
        {
          title: _(msg`Fake Account or Bot`),
          reason: 'tools.ozone.report.defs#reasonMisleadingBot',
        },
        {
          title: _(msg`Impersonation`),
          reason: 'tools.ozone.report.defs#reasonMisleadingImpersonation',
        },
        {
          title: _(msg`Spam`),
          reason: 'com.atproto.moderation.defs#reasonSpam',
        },
        {
          title: _(msg`Scam`),
          reason: 'tools.ozone.report.defs#reasonMisleadingScam',
        },
        {
          title: _(msg`Unlabelled GenAI or Synthetic Content`),
          reason: 'tools.ozone.report.defs#reasonMisleadingSyntheticContent',
        },
        {
          title: _(msg`Harmful False Claims`),
          reason: 'tools.ozone.report.defs#reasonMisleadingMisinformation',
        },
        {
          title: _(msg`Other Misleading Content`),
          reason: 'tools.ozone.report.defs#reasonMisleadingOther',
        },
      ],
    },
    ruleBreaking: {
      key: 'ruleBreaking',
      title: _(msg`Breaking Network Rules`),
      description: _(msg`Hacking, stolen content, or prohibited sales`),
      sort: 6,
      options: [
        {
          title: _(msg`Hacking or System Attacks`),
          reason: 'tools.ozone.report.defs#reasonRuleSiteSecurity',
        },
        {
          title: _(msg`Stolen Content`),
          reason: 'tools.ozone.report.defs#reasonRuleStolenContent',
        },
        {
          title: _(msg`Promoting or Selling Prohibited Items of Services`),
          reason: 'tools.ozone.report.defs#reasonRuleProhibitedSales',
        },
        {
          title: _(msg`Banned User Returning`),
          reason: 'tools.ozone.report.defs#reasonRuleBanEvasion',
        },
        {
          title: _(msg`Other`),
          reason: 'tools.ozone.report.defs#reasonRuleOther',
        },
      ],
    },
    civicIntegrity: {
      key: 'civicIntegrity',
      title: _(msg`Civic Integrity`),
      description: _(
        msg`Electoral interference or political process violations`,
      ),
      sort: 7,
      options: [
        {
          title: _(msg`Electoral Process Violations`),
          reason: 'tools.ozone.report.defs#reasonCivicElectoralProcess',
        },
        {
          title: _(msg`Disclosure and Transparency Violations`),
          reason: 'tools.ozone.report.defs#reasonCivicDisclosure',
        },
        {
          title: _(msg`Voter Intimidation or Interference`),
          reason: 'tools.ozone.report.defs#reasonCivicInterference',
        },
        {
          title: _(msg`Election Misinformation`),
          reason: 'tools.ozone.report.defs#reasonCivicMisinformation',
        },
        {
          title: _(msg`Impersonation of Electoral Officials/Entities`),
          reason: 'tools.ozone.report.defs#reasonCivicImpersonation',
        },
        {
          title: _(msg`Other`),
          reason: 'tools.ozone.report.defs#reasonViolenceOther',
        },
      ],
    },
    other: {
      key: 'other',
      title: _(msg`Other`),
      description: _(msg`An issue not included in these options`),
      sort: 8,
      options: [
        {
          title: _(msg`Other`),
          reason: 'com.atproto.moderation.defs#reasonOther',
        },
      ],
      isOther: true,
    },
  }

  const sortedCategories = (
    Object.values(categories) as ReportOptionCategory[]
  ).sort((a, b) => a.sort - b.sort)

  const getCategory = (reasonName: ReportCategory) => {
    return categories[reasonName]
  }

  return {categories, sortedCategories, getCategory}
}
