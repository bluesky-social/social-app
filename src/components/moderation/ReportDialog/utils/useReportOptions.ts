import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export type TopLevelReason =
  | 'childSafety'
  | 'violencePhysicalHarm'
  | 'sexualAdultContent'
  | 'harassmentHate'
  | 'misleading'
  | 'ruleBreaking'
  | 'civicIntegrity'
  | 'other'

export interface TopLevelReportOption {
  key: TopLevelReason
  title: string
  description: string
  options: ReportOption[]
  sort: number
  isOther?: boolean
}

export interface TopLevelReportOptions {
  childSafety: TopLevelReportOption
  violencePhysicalHarm: TopLevelReportOption
  sexualAdultContent: TopLevelReportOption
  harassmentHate: TopLevelReportOption
  misleading: TopLevelReportOption
  ruleBreaking: TopLevelReportOption
  civicIntegrity: TopLevelReportOption
  other: TopLevelReportOption
}

export interface ReportOption {
  title: string
  reason: string
}

export function useReportOptions() {
  const {_} = useLingui()

  const reasons = {
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
          reason: '#reasonChildSafetyCSAM',
        },
        {
          title: _(msg`Grooming or Predatory Behavior`),
          reason: '#reasonChildSafetyGroom',
        },
        {
          title: _(msg`Minor Privacy Violation`),
          reason: '#reasonChildSafetyMinorPrivacy',
        },
        {
          title: _(msg`Child Endangerment`),
          reason: '#reasonChildSafetyEndangerment',
        },
        {
          title: _(msg`Minor Harassment or Bullying`),
          reason: '#reasonChildSafetyHarassment',
        },
        {
          title: _(msg`Promotion of Child Exploitation`),
          reason: '#reasonChildSafetyPromotion',
        },
        {
          title: _(msg`Other Child Safety`),
          reason: '#reasonChildSafetyOther',
        },
      ],
    },
    violencePhysicalHarm: {
      key: 'violencePhysicalHarm',
      title: _(msg`Violence of Physical Harm`),
      sort: 2,
      description: _(msg`Threats, calls for violence, or graphic content`),
      options: [
        {
          title: _(msg`Animal Welfare`),
          reason: '#reasonViolenceAnimalWelfare',
        },
        {
          title: _(msg`Threats or Inticement`),
          reason: '#reasonViolenceThreats',
        },
        {
          title: _(msg`Graphic Violent Content`),
          reason: '#reasonViolenceGraphicContent',
        },
        {
          title: _(msg`Self Harm`),
          reason: '#reasonViolenceSelfHarm',
        },
        {
          title: _(msg`Glorification of Violence`),
          reason: '#reasonViolenceGlorification',
        },
        {
          title: _(msg`Extermist Content`),
          reason: '#reasonViolenceExtermistContent',
        },
        {
          title: _(msg`Human Trafficking`),
          reason: '#reasonViolenceTrafficking',
        },
        {
          title: _(msg`Other Violent Content`),
          reason: '#reasonViolenceOther',
        },
      ],
    },
    sexualAdultContent: {
      key: 'sexualAdultContent',
      title: _(msg`Sexaul and Adult Content`),
      description: _(msg`Adult, child or animal sexual abuse`),
      sort: 3,
      options: [
        {
          title: _(msg`Adult Sexual Abuse Content`),
          reason: '#reasonSexualAbuseContent',
        },
        {
          title: _(msg`Non-Consensual Intimate Imagery`),
          reason: '#reasonSexualNCII',
        },
        {
          title: _(msg`SexualSextortion`),
          reason: '#reasonSexualSextortion',
        },
        {
          title: _(msg`Deepfake Adult Content`),
          reason: '#reasonSexualDeepfake',
        },
        {
          title: _(msg`Animal Sexual Abuse`),
          reason: '#reasonSexualAnimal',
        },
        {
          title: _(msg`Unlabelled Adult Content`),
          reason: '#reasonSexualUnlabelled',
        },
        {
          title: _(msg`Other Sexual Violence Content`),
          reason: '#reasonSexualOther',
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
          reason: '#reasonHarassmentTroll',
        },
        {
          title: _(msg`Targeted Harassment`),
          reason: '#reasonHarassmentTargeted',
        },
        {
          title: _(msg`Hate Speech`),
          reason: '#reasonHarassmentHateSpeech',
        },
        {
          title: _(msg`Doxxing`),
          reason: '#reasonHarassmentDoxxing',
        },
        {
          title: _(msg`Other Harassing or Hateful Content`),
          reason: '#reasonHarassmentOther',
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
          reason: '#reasonMisleadingBot',
        },
        {
          title: _(msg`Impersonation`),
          reason: '#reasonMisleadingImpersonation',
        },
        {
          title: _(msg`Spam`),
          reason: '#reasonMisleadingSpam',
        },
        {
          title: _(msg`Scam`),
          reason: '#reasonMisleadingScam',
        },
        {
          title: _(msg`Unlabelled GenAI or Synthetic Content`),
          reason: '#reasonMisleadingSyntheticContent',
        },
        {
          title: _(msg`Harmful False Claims`),
          reason: '#reasonMisleadingMisinformation',
        },
        {
          title: _(msg`Other Misleading Content`),
          reason: '#reasonMisleadingOther',
        },
      ],
    },
    ruleBreaking: {
      key: 'ruleBreaking',
      title: _(msg`Breaking Network Rules`),
      description: _(msg`Hacking, stolen content or prohibited sales`),
      sort: 6,
      options: [
        {
          title: _(msg`Hacking or System Attacks`),
          reason: '#reasonRuleSiteSecurity',
        },
        {
          title: _(msg`Stolen Content`),
          reason: '#reasonRuleStolenContent',
        },
        {
          title: _(msg`Promoting or Selling Prohibited Items of Services`),
          reason: '#reasonRuleProhibitedSales',
        },
        {
          title: _(msg`Banned User Returning`),
          reason: '#reasonRuleBanEvasion',
        },
        {
          title: _(msg`Other`),
          reason: '#reasonRuleOther',
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
          reason: '#reasonCivicElectoralProcess',
        },
        {
          title: _(msg`Disclosure and Transparency Violations`),
          reason: '#reasonCivicDisclosure',
        },
        {
          title: _(msg`Voter Intimidation or Interference`),
          reason: '#reasonCivicInterference',
        },
        {
          title: _(msg`Election Misinformation`),
          reason: '#reasonCivicMisinformation',
        },
        {
          title: _(msg`Impersation of Electoral Officials/Entities`),
          reason: '#reasonCivicImpersonation',
        },
        {
          title: _(msg`Other`),
          reason: '#reasonCivicOther',
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
          reason: '#reasonOther',
        },
      ],
      isOther: true,
    },
  }

  const sortedReasons = Object.values(reasons).sort((a, b) => a.sort - b.sort)

  const getTopLevelReason = (reasonName: TopLevelReason) => {
    return reasons[reasonName]
  }

  return {reasons, sortedReasons, getTopLevelReason}
}
