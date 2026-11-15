import {useMemo} from 'react'
import {useLingui} from '@lingui/react/macro'

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
  const {t: l} = useLingui()

  return useMemo(() => {
    const categories: Record<ReportCategory, ReportCategoryConfig> = {
      misleading: {
        key: 'misleading',
        title: l`Misleading`,
        description: l`Spam or other inauthentic behavior or deception`,
        options: [
          {
            title: l`Spam`,
            reason: tools.ozone.report.defs.reasonMisleadingSpam.value,
          },
          {
            title: l`Scam`,
            reason: tools.ozone.report.defs.reasonMisleadingScam.value,
          },
          {
            title: l`Fake account or bot`,
            reason: tools.ozone.report.defs.reasonMisleadingBot.value,
          },
          {
            title: l`Impersonation`,
            reason: tools.ozone.report.defs.reasonMisleadingImpersonation.value,
          },
          {
            title: l`False information about elections`,
            reason: tools.ozone.report.defs.reasonMisleadingElections.value,
          },
          {
            title: l`Other misleading content`,
            reason: tools.ozone.report.defs.reasonMisleadingOther.value,
          },
        ],
      },
      sexualAdultContent: {
        key: 'sexualAdultContent',
        title: l`Adult content`,
        description: l`Unlabeled, abusive, or non-consensual adult content`,
        options: [
          {
            title: l`Unlabeled adult content`,
            reason: tools.ozone.report.defs.reasonSexualUnlabeled.value,
          },
          {
            title: l`Adult sexual abuse content`,
            reason: tools.ozone.report.defs.reasonSexualAbuseContent.value,
          },
          {
            title: l`Non-consensual intimate imagery`,
            reason: tools.ozone.report.defs.reasonSexualNCII.value,
          },
          {
            title: l`Deepfake adult content`,
            reason: tools.ozone.report.defs.reasonSexualDeepfake.value,
          },
          {
            title: l`Animal sexual abuse`,
            reason: tools.ozone.report.defs.reasonSexualAnimal.value,
          },
          {
            title: l`Other sexual violence content`,
            reason: tools.ozone.report.defs.reasonSexualOther.value,
          },
        ],
      },
      harassmentHate: {
        key: 'harassmentHate',
        title: l`Harassment or hate`,
        description: l`Abusive or discriminatory behavior`,
        options: [
          {
            title: l`Trolling`,
            reason: tools.ozone.report.defs.reasonHarassmentTroll.value,
          },
          {
            title: l`Targeted harassment`,
            reason: tools.ozone.report.defs.reasonHarassmentTargeted.value,
          },
          {
            title: l`Hate speech`,
            reason: tools.ozone.report.defs.reasonHarassmentHateSpeech.value,
          },
          {
            title: l`Doxxing`,
            reason: tools.ozone.report.defs.reasonHarassmentDoxxing.value,
          },
          {
            title: l`Other harassing or hateful content`,
            reason: tools.ozone.report.defs.reasonHarassmentOther.value,
          },
        ],
      },
      violencePhysicalHarm: {
        key: 'violencePhysicalHarm',
        title: l`Violence`,
        description: l`Violent or threatening content`,
        options: [
          {
            title: l`Animal welfare`,
            reason: tools.ozone.report.defs.reasonViolenceAnimal.value,
          },
          {
            title: l`Threats or incitement`,
            reason: tools.ozone.report.defs.reasonViolenceThreats.value,
          },
          {
            title: l`Graphic violent content`,
            reason: tools.ozone.report.defs.reasonViolenceGraphicContent.value,
          },
          {
            title: l`Glorification of violence`,
            reason: tools.ozone.report.defs.reasonViolenceGlorification.value,
          },
          {
            title: l`Extremist content`,
            reason:
              tools.ozone.report.defs.reasonViolenceExtremistContent.value,
          },
          {
            title: l`Human trafficking`,
            reason: tools.ozone.report.defs.reasonViolenceTrafficking.value,
          },
          {
            title: l`Other violent content`,
            reason: tools.ozone.report.defs.reasonViolenceOther.value,
          },
        ],
      },
      childSafety: {
        key: 'childSafety',
        title: l`Child safety`,
        description: l`Harming or endangering minors`,
        options: [
          {
            title: l`Child Sexual Abuse Material (CSAM)`,
            reason: tools.ozone.report.defs.reasonChildSafetyCSAM.value,
          },
          {
            title: l`Grooming or predatory behavior`,
            reason: tools.ozone.report.defs.reasonChildSafetyGroom.value,
          },
          {
            title: l`Privacy violation of a minor`,
            reason: tools.ozone.report.defs.reasonChildSafetyPrivacy.value,
          },
          {
            title: l`Minor harassment or bullying`,
            reason: tools.ozone.report.defs.reasonChildSafetyHarassment.value,
          },
          {
            title: l`Other child safety issue`,
            reason: tools.ozone.report.defs.reasonChildSafetyOther.value,
          },
        ],
      },
      selfHarm: {
        key: 'selfHarm',
        title: l`Self-harm or dangerous behaviors`,
        description: l`Harmful or high-risk activities`,
        options: [
          {
            title: l`Content promoting or depicting self-harm`,
            reason: tools.ozone.report.defs.reasonSelfHarmContent.value,
          },
          {
            title: l`Eating disorders`,
            reason: tools.ozone.report.defs.reasonSelfHarmED.value,
          },
          {
            title: l`Dangerous challenges or activities`,
            reason: tools.ozone.report.defs.reasonSelfHarmStunts.value,
          },
          {
            title: l`Dangerous substances or drug abuse`,
            reason: tools.ozone.report.defs.reasonSelfHarmSubstances.value,
          },
          {
            title: l`Other dangerous content`,
            reason: tools.ozone.report.defs.reasonSelfHarmOther.value,
          },
        ],
      },
      ruleBreaking: {
        key: 'ruleBreaking',
        title: l`Breaking site rules`,
        description: l`Banned activities or security violations`,
        options: [
          {
            title: l`Hacking or system attacks`,
            reason: tools.ozone.report.defs.reasonRuleSiteSecurity.value,
          },
          {
            title: l`Promoting or selling prohibited items or services`,
            reason: tools.ozone.report.defs.reasonRuleProhibitedSales.value,
          },
          {
            title: l`Banned user returning`,
            reason: tools.ozone.report.defs.reasonRuleBanEvasion.value,
          },
          {
            title: l`Other network rule-breaking`,
            reason: tools.ozone.report.defs.reasonRuleOther.value,
          },
        ],
      },
      other: {
        key: 'other',
        title: l`Other`,
        description: l`An issue not included in these options`,
        options: [
          {
            title: l`Other`,
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
  }, [l])
}
