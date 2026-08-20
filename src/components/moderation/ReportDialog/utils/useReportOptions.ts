import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import * as ToolsOzoneReportDefs from '#/lexicons/tools/ozone/report/defs'

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
  reason: ToolsOzoneReportDefs.ReasonType
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
            reason: ToolsOzoneReportDefs.reasonMisleadingSpam.value,
          },
          {
            title: _(msg`Scam`),
            reason: ToolsOzoneReportDefs.reasonMisleadingScam.value,
          },
          {
            title: _(msg`Fake account or bot`),
            reason: ToolsOzoneReportDefs.reasonMisleadingBot.value,
          },
          {
            title: _(msg`Impersonation`),
            reason: ToolsOzoneReportDefs.reasonMisleadingImpersonation.value,
          },
          {
            title: _(msg`False information about elections`),
            reason: ToolsOzoneReportDefs.reasonMisleadingElections.value,
          },
          {
            title: _(msg`Other misleading content`),
            reason: ToolsOzoneReportDefs.reasonMisleadingOther.value,
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
            reason: ToolsOzoneReportDefs.reasonSexualUnlabeled.value,
          },
          {
            title: _(msg`Adult sexual abuse content`),
            reason: ToolsOzoneReportDefs.reasonSexualAbuseContent.value,
          },
          {
            title: _(msg`Non-consensual intimate imagery`),
            reason: ToolsOzoneReportDefs.reasonSexualNCII.value,
          },
          {
            title: _(msg`Deepfake adult content`),
            reason: ToolsOzoneReportDefs.reasonSexualDeepfake.value,
          },
          {
            title: _(msg`Animal sexual abuse`),
            reason: ToolsOzoneReportDefs.reasonSexualAnimal.value,
          },
          {
            title: _(msg`Other sexual violence content`),
            reason: ToolsOzoneReportDefs.reasonSexualOther.value,
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
            reason: ToolsOzoneReportDefs.reasonHarassmentTroll.value,
          },
          {
            title: _(msg`Targeted harassment`),
            reason: ToolsOzoneReportDefs.reasonHarassmentTargeted.value,
          },
          {
            title: _(msg`Hate speech`),
            reason: ToolsOzoneReportDefs.reasonHarassmentHateSpeech.value,
          },
          {
            title: _(msg`Doxxing`),
            reason: ToolsOzoneReportDefs.reasonHarassmentDoxxing.value,
          },
          {
            title: _(msg`Other harassing or hateful content`),
            reason: ToolsOzoneReportDefs.reasonHarassmentOther.value,
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
            reason: ToolsOzoneReportDefs.reasonViolenceAnimal.value,
          },
          {
            title: _(msg`Threats or incitement`),
            reason: ToolsOzoneReportDefs.reasonViolenceThreats.value,
          },
          {
            title: _(msg`Graphic violent content`),
            reason: ToolsOzoneReportDefs.reasonViolenceGraphicContent.value,
          },
          {
            title: _(msg`Glorification of violence`),
            reason: ToolsOzoneReportDefs.reasonViolenceGlorification.value,
          },
          {
            title: _(msg`Extremist content`),
            reason: ToolsOzoneReportDefs.reasonViolenceExtremistContent.value,
          },
          {
            title: _(msg`Human trafficking`),
            reason: ToolsOzoneReportDefs.reasonViolenceTrafficking.value,
          },
          {
            title: _(msg`Other violent content`),
            reason: ToolsOzoneReportDefs.reasonViolenceOther.value,
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
            reason: ToolsOzoneReportDefs.reasonChildSafetyCSAM.value,
          },
          {
            title: _(msg`Grooming or predatory behavior`),
            reason: ToolsOzoneReportDefs.reasonChildSafetyGroom.value,
          },
          {
            title: _(msg`Privacy violation of a minor`),
            reason: ToolsOzoneReportDefs.reasonChildSafetyPrivacy.value,
          },
          {
            title: _(msg`Minor harassment or bullying`),
            reason: ToolsOzoneReportDefs.reasonChildSafetyHarassment.value,
          },
          {
            title: _(msg`Other child safety issue`),
            reason: ToolsOzoneReportDefs.reasonChildSafetyOther.value,
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
            reason: ToolsOzoneReportDefs.reasonSelfHarmContent.value,
          },
          {
            title: _(msg`Eating disorders`),
            reason: ToolsOzoneReportDefs.reasonSelfHarmED.value,
          },
          {
            title: _(msg`Dangerous challenges or activities`),
            reason: ToolsOzoneReportDefs.reasonSelfHarmStunts.value,
          },
          {
            title: _(msg`Dangerous substances or drug abuse`),
            reason: ToolsOzoneReportDefs.reasonSelfHarmSubstances.value,
          },
          {
            title: _(msg`Other dangerous content`),
            reason: ToolsOzoneReportDefs.reasonSelfHarmOther.value,
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
            reason: ToolsOzoneReportDefs.reasonRuleSiteSecurity.value,
          },
          {
            title: _(msg`Promoting or selling prohibited items or services`),
            reason: ToolsOzoneReportDefs.reasonRuleProhibitedSales.value,
          },
          {
            title: _(msg`Banned user returning`),
            reason: ToolsOzoneReportDefs.reasonRuleBanEvasion.value,
          },
          {
            title: _(msg`Other network rule-breaking`),
            reason: ToolsOzoneReportDefs.reasonRuleOther.value,
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
            reason: ToolsOzoneReportDefs.reasonOther.value,
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
