import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {tools} from '#/lexicons'

export type ReportCategory =
  | 'childSafety'
  | 'violencePhysicalHarm'
  | 'sexualAdultContent'
  | 'harassmentHate'
  | 'misleading'
  | 'ruleBreaking'
  | 'selfHarm'
  | 'other'

export type ReportCategoryConfig = {
  key: ReportCategory
  title: string
  description: string
  options: ReportOption[]
}

export type ReportOption = {
  title: string
  reason: tools.ozone.report.defs.ReasonType
}

export function useReportOptions() {
  const {_} = useLingui()

  return useMemo(() => {
    const categories: Record<ReportCategory, ReportCategoryConfig> = {
      misleading: {
        key: 'misleading',
        title: _(msg`Misleading`),
        description: _(msg`Spam or other inauthentic behavior or deception`),
        options: [
          {
            title: _(msg`Spam`),
            reason: tools.ozone.report.defs.reasonMisleadingSpam,
          },
          {
            title: _(msg`Scam`),
            reason: tools.ozone.report.defs.reasonMisleadingScam,
          },
          {
            title: _(msg`Fake account or bot`),
            reason: tools.ozone.report.defs.reasonMisleadingBot,
          },
          {
            title: _(msg`Impersonation`),
            reason: tools.ozone.report.defs.reasonMisleadingImpersonation,
          },
          {
            title: _(msg`False information about elections`),
            reason: tools.ozone.report.defs.reasonMisleadingElections,
          },
          {
            title: _(msg`Other misleading content`),
            reason: tools.ozone.report.defs.reasonMisleadingOther,
          },
        ],
      },
      sexualAdultContent: {
        key: 'sexualAdultContent',
        title: _(msg`Adult content`),
        description: _(
          msg`Unlabeled, abusive, or non-consensual adult content`,
        ),
        options: [
          {
            title: _(msg`Unlabeled adult content`),
            reason: tools.ozone.report.defs.reasonSexualUnlabeled,
          },
          {
            title: _(msg`Adult sexual abuse content`),
            reason: tools.ozone.report.defs.reasonSexualAbuseContent,
          },
          {
            title: _(msg`Non-consensual intimate imagery`),
            reason: tools.ozone.report.defs.reasonSexualNCII,
          },
          {
            title: _(msg`Deepfake adult content`),
            reason: tools.ozone.report.defs.reasonSexualDeepfake,
          },
          {
            title: _(msg`Animal sexual abuse`),
            reason: tools.ozone.report.defs.reasonSexualAnimal,
          },
          {
            title: _(msg`Other sexual violence content`),
            reason: tools.ozone.report.defs.reasonSexualOther,
          },
        ],
      },
      harassmentHate: {
        key: 'harassmentHate',
        title: _(msg`Harassment or hate`),
        description: _(msg`Abusive or discriminatory behavior`),
        options: [
          {
            title: _(msg`Trolling`),
            reason: tools.ozone.report.defs.reasonHarassmentTroll,
          },
          {
            title: _(msg`Targeted harassment`),
            reason: tools.ozone.report.defs.reasonHarassmentTargeted,
          },
          {
            title: _(msg`Hate speech`),
            reason: tools.ozone.report.defs.reasonHarassmentHateSpeech,
          },
          {
            title: _(msg`Doxxing`),
            reason: tools.ozone.report.defs.reasonHarassmentDoxxing,
          },
          {
            title: _(msg`Other harassing or hateful content`),
            reason: tools.ozone.report.defs.reasonHarassmentOther,
          },
        ],
      },
      violencePhysicalHarm: {
        key: 'violencePhysicalHarm',
        title: _(msg`Violence`),
        description: _(msg`Violent or threatening content`),
        options: [
          {
            title: _(msg`Animal welfare`),
            reason: tools.ozone.report.defs.reasonViolenceAnimal,
          },
          {
            title: _(msg`Threats or incitement`),
            reason: tools.ozone.report.defs.reasonViolenceThreats,
          },
          {
            title: _(msg`Graphic violent content`),
            reason: tools.ozone.report.defs.reasonViolenceGraphicContent,
          },
          {
            title: _(msg`Glorification of violence`),
            reason: tools.ozone.report.defs.reasonViolenceGlorification,
          },
          {
            title: _(msg`Extremist content`),
            reason: tools.ozone.report.defs.reasonViolenceExtremistContent,
          },
          {
            title: _(msg`Human trafficking`),
            reason: tools.ozone.report.defs.reasonViolenceTrafficking,
          },
          {
            title: _(msg`Other violent content`),
            reason: tools.ozone.report.defs.reasonViolenceOther,
          },
        ],
      },
      childSafety: {
        key: 'childSafety',
        title: _(msg`Child safety`),
        description: _(msg`Harming or endangering minors`),
        options: [
          {
            title: _(msg`Child Sexual Abuse Material (CSAM)`),
            reason: tools.ozone.report.defs.reasonChildSafetyCSAM,
          },
          {
            title: _(msg`Grooming or predatory behavior`),
            reason: tools.ozone.report.defs.reasonChildSafetyGroom,
          },
          {
            title: _(msg`Privacy violation of a minor`),
            reason: tools.ozone.report.defs.reasonChildSafetyPrivacy,
          },
          {
            title: _(msg`Minor harassment or bullying`),
            reason: tools.ozone.report.defs.reasonChildSafetyHarassment,
          },
          {
            title: _(msg`Other child safety issue`),
            reason: tools.ozone.report.defs.reasonChildSafetyOther,
          },
        ],
      },
      selfHarm: {
        key: 'selfHarm',
        title: _(msg`Self-harm or dangerous behaviors`),
        description: _(msg`Harmful or high-risk activities`),
        options: [
          {
            title: _(msg`Content promoting or depicting self-harm`),
            reason: tools.ozone.report.defs.reasonSelfHarmContent,
          },
          {
            title: _(msg`Eating disorders`),
            reason: tools.ozone.report.defs.reasonSelfHarmED,
          },
          {
            title: _(msg`Dangerous challenges or activities`),
            reason: tools.ozone.report.defs.reasonSelfHarmStunts,
          },
          {
            title: _(msg`Dangerous substances or drug abuse`),
            reason: tools.ozone.report.defs.reasonSelfHarmSubstances,
          },
          {
            title: _(msg`Other dangerous content`),
            reason: tools.ozone.report.defs.reasonSelfHarmOther,
          },
        ],
      },
      ruleBreaking: {
        key: 'ruleBreaking',
        title: _(msg`Breaking site rules`),
        description: _(msg`Banned activities or security violations`),
        options: [
          {
            title: _(msg`Hacking or system attacks`),
            reason: tools.ozone.report.defs.reasonRuleSiteSecurity,
          },
          {
            title: _(msg`Promoting or selling prohibited items or services`),
            reason: tools.ozone.report.defs.reasonRuleProhibitedSales,
          },
          {
            title: _(msg`Banned user returning`),
            reason: tools.ozone.report.defs.reasonRuleBanEvasion,
          },
          {
            title: _(msg`Other network rule-breaking`),
            reason: tools.ozone.report.defs.reasonRuleOther,
          },
        ],
      },
      other: {
        key: 'other',
        title: _(msg`Other`),
        description: _(msg`An issue not included in these options`),
        options: [
          {
            title: _(msg`Other`),
            reason: tools.ozone.report.defs.reasonOther,
          },
        ],
      },
    }

    return {
      categories: Object.values(categories),
      getCategory(reasonName: ReportCategory) {
        return categories[reasonName]
      },
    }
  }, [_])
}
