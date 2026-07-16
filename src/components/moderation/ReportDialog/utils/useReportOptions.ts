import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {tools} from '#/lexicons'

const OzoneReportDefs = tools.ozone.report.defs

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
            reason: OzoneReportDefs.reasonMisleadingSpam.value,
          },
          {
            title: _(msg`Scam`),
            reason: OzoneReportDefs.reasonMisleadingScam.value,
          },
          {
            title: _(msg`Fake account or bot`),
            reason: OzoneReportDefs.reasonMisleadingBot.value,
          },
          {
            title: _(msg`Impersonation`),
            reason: OzoneReportDefs.reasonMisleadingImpersonation.value,
          },
          {
            title: _(msg`False information about elections`),
            reason: OzoneReportDefs.reasonMisleadingElections.value,
          },
          {
            title: _(msg`Other misleading content`),
            reason: OzoneReportDefs.reasonMisleadingOther.value,
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
            reason: OzoneReportDefs.reasonSexualUnlabeled.value,
          },
          {
            title: _(msg`Adult sexual abuse content`),
            reason: OzoneReportDefs.reasonSexualAbuseContent.value,
          },
          {
            title: _(msg`Non-consensual intimate imagery`),
            reason: OzoneReportDefs.reasonSexualNCII.value,
          },
          {
            title: _(msg`Deepfake adult content`),
            reason: OzoneReportDefs.reasonSexualDeepfake.value,
          },
          {
            title: _(msg`Animal sexual abuse`),
            reason: OzoneReportDefs.reasonSexualAnimal.value,
          },
          {
            title: _(msg`Other sexual violence content`),
            reason: OzoneReportDefs.reasonSexualOther.value,
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
            reason: OzoneReportDefs.reasonHarassmentTroll.value,
          },
          {
            title: _(msg`Targeted harassment`),
            reason: OzoneReportDefs.reasonHarassmentTargeted.value,
          },
          {
            title: _(msg`Hate speech`),
            reason: OzoneReportDefs.reasonHarassmentHateSpeech.value,
          },
          {
            title: _(msg`Doxxing`),
            reason: OzoneReportDefs.reasonHarassmentDoxxing.value,
          },
          {
            title: _(msg`Other harassing or hateful content`),
            reason: OzoneReportDefs.reasonHarassmentOther.value,
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
            reason: OzoneReportDefs.reasonViolenceAnimal.value,
          },
          {
            title: _(msg`Threats or incitement`),
            reason: OzoneReportDefs.reasonViolenceThreats.value,
          },
          {
            title: _(msg`Graphic violent content`),
            reason: OzoneReportDefs.reasonViolenceGraphicContent.value,
          },
          {
            title: _(msg`Glorification of violence`),
            reason: OzoneReportDefs.reasonViolenceGlorification.value,
          },
          {
            title: _(msg`Extremist content`),
            reason: OzoneReportDefs.reasonViolenceExtremistContent.value,
          },
          {
            title: _(msg`Human trafficking`),
            reason: OzoneReportDefs.reasonViolenceTrafficking.value,
          },
          {
            title: _(msg`Other violent content`),
            reason: OzoneReportDefs.reasonViolenceOther.value,
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
            reason: OzoneReportDefs.reasonChildSafetyCSAM.value,
          },
          {
            title: _(msg`Grooming or predatory behavior`),
            reason: OzoneReportDefs.reasonChildSafetyGroom.value,
          },
          {
            title: _(msg`Privacy violation of a minor`),
            reason: OzoneReportDefs.reasonChildSafetyPrivacy.value,
          },
          {
            title: _(msg`Minor harassment or bullying`),
            reason: OzoneReportDefs.reasonChildSafetyHarassment.value,
          },
          {
            title: _(msg`Other child safety issue`),
            reason: OzoneReportDefs.reasonChildSafetyOther.value,
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
            reason: OzoneReportDefs.reasonSelfHarmContent.value,
          },
          {
            title: _(msg`Eating disorders`),
            reason: OzoneReportDefs.reasonSelfHarmED.value,
          },
          {
            title: _(msg`Dangerous challenges or activities`),
            reason: OzoneReportDefs.reasonSelfHarmStunts.value,
          },
          {
            title: _(msg`Dangerous substances or drug abuse`),
            reason: OzoneReportDefs.reasonSelfHarmSubstances.value,
          },
          {
            title: _(msg`Other dangerous content`),
            reason: OzoneReportDefs.reasonSelfHarmOther.value,
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
            reason: OzoneReportDefs.reasonRuleSiteSecurity.value,
          },
          {
            title: _(msg`Promoting or selling prohibited items or services`),
            reason: OzoneReportDefs.reasonRuleProhibitedSales.value,
          },
          {
            title: _(msg`Banned user returning`),
            reason: OzoneReportDefs.reasonRuleBanEvasion.value,
          },
          {
            title: _(msg`Other network rule-breaking`),
            reason: OzoneReportDefs.reasonRuleOther.value,
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
            reason: OzoneReportDefs.reasonOther.value,
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
