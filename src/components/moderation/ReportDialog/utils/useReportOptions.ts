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
            reason: tools.ozone.report.defs.reasonMisleadingSpam.value,
          },
          {
            title: _(msg`Scam`),
            reason: tools.ozone.report.defs.reasonMisleadingScam.value,
          },
          {
            title: _(msg`Fake account or bot`),
            reason: tools.ozone.report.defs.reasonMisleadingBot.value,
          },
          {
            title: _(msg`Impersonation`),
            reason: tools.ozone.report.defs.reasonMisleadingImpersonation.value,
          },
          {
            title: _(msg`False information about elections`),
            reason: tools.ozone.report.defs.reasonMisleadingElections.value,
          },
          {
            title: _(msg`Other misleading content`),
            reason: tools.ozone.report.defs.reasonMisleadingOther.value,
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
            reason: tools.ozone.report.defs.reasonSexualUnlabeled.value,
          },
          {
            title: _(msg`Adult sexual abuse content`),
            reason: tools.ozone.report.defs.reasonSexualAbuseContent.value,
          },
          {
            title: _(msg`Non-consensual intimate imagery`),
            reason: tools.ozone.report.defs.reasonSexualNCII.value,
          },
          {
            title: _(msg`Deepfake adult content`),
            reason: tools.ozone.report.defs.reasonSexualDeepfake.value,
          },
          {
            title: _(msg`Animal sexual abuse`),
            reason: tools.ozone.report.defs.reasonSexualAnimal.value,
          },
          {
            title: _(msg`Other sexual violence content`),
            reason: tools.ozone.report.defs.reasonSexualOther.value,
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
            reason: tools.ozone.report.defs.reasonHarassmentTroll.value,
          },
          {
            title: _(msg`Targeted harassment`),
            reason: tools.ozone.report.defs.reasonHarassmentTargeted.value,
          },
          {
            title: _(msg`Hate speech`),
            reason: tools.ozone.report.defs.reasonHarassmentHateSpeech.value,
          },
          {
            title: _(msg`Doxxing`),
            reason: tools.ozone.report.defs.reasonHarassmentDoxxing.value,
          },
          {
            title: _(msg`Other harassing or hateful content`),
            reason: tools.ozone.report.defs.reasonHarassmentOther.value,
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
            reason: tools.ozone.report.defs.reasonViolenceAnimal.value,
          },
          {
            title: _(msg`Threats or incitement`),
            reason: tools.ozone.report.defs.reasonViolenceThreats.value,
          },
          {
            title: _(msg`Graphic violent content`),
            reason: tools.ozone.report.defs.reasonViolenceGraphicContent.value,
          },
          {
            title: _(msg`Glorification of violence`),
            reason: tools.ozone.report.defs.reasonViolenceGlorification.value,
          },
          {
            title: _(msg`Extremist content`),
            reason:
              tools.ozone.report.defs.reasonViolenceExtremistContent.value,
          },
          {
            title: _(msg`Human trafficking`),
            reason: tools.ozone.report.defs.reasonViolenceTrafficking.value,
          },
          {
            title: _(msg`Other violent content`),
            reason: tools.ozone.report.defs.reasonViolenceOther.value,
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
            reason: tools.ozone.report.defs.reasonChildSafetyCSAM.value,
          },
          {
            title: _(msg`Grooming or predatory behavior`),
            reason: tools.ozone.report.defs.reasonChildSafetyGroom.value,
          },
          {
            title: _(msg`Privacy violation of a minor`),
            reason: tools.ozone.report.defs.reasonChildSafetyPrivacy.value,
          },
          {
            title: _(msg`Minor harassment or bullying`),
            reason: tools.ozone.report.defs.reasonChildSafetyHarassment.value,
          },
          {
            title: _(msg`Other child safety issue`),
            reason: tools.ozone.report.defs.reasonChildSafetyOther.value,
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
            reason: tools.ozone.report.defs.reasonSelfHarmContent.value,
          },
          {
            title: _(msg`Eating disorders`),
            reason: tools.ozone.report.defs.reasonSelfHarmED.value,
          },
          {
            title: _(msg`Dangerous challenges or activities`),
            reason: tools.ozone.report.defs.reasonSelfHarmStunts.value,
          },
          {
            title: _(msg`Dangerous substances or drug abuse`),
            reason: tools.ozone.report.defs.reasonSelfHarmSubstances.value,
          },
          {
            title: _(msg`Other dangerous content`),
            reason: tools.ozone.report.defs.reasonSelfHarmOther.value,
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
            reason: tools.ozone.report.defs.reasonRuleSiteSecurity.value,
          },
          {
            title: _(msg`Promoting or selling prohibited items or services`),
            reason: tools.ozone.report.defs.reasonRuleProhibitedSales.value,
          },
          {
            title: _(msg`Banned user returning`),
            reason: tools.ozone.report.defs.reasonRuleBanEvasion.value,
          },
          {
            title: _(msg`Other network rule-breaking`),
            reason: tools.ozone.report.defs.reasonRuleOther.value,
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
            reason: tools.ozone.report.defs.reasonOther.value,
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
