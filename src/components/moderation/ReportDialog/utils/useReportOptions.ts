import {useMemo} from 'react'
import {ToolsOzoneReportDefs as OzoneReportDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

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
  reason: OzoneReportDefs.ReasonType
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
            reason: OzoneReportDefs.REASONMISLEADINGSPAM,
          },
          {
            title: l`Scam`,
            reason: OzoneReportDefs.REASONMISLEADINGSCAM,
          },
          {
            title: l`Fake account or bot`,
            reason: OzoneReportDefs.REASONMISLEADINGBOT,
          },
          {
            title: l`Impersonation`,
            reason: OzoneReportDefs.REASONMISLEADINGIMPERSONATION,
          },
          {
            title: l`False information about elections`,
            reason: OzoneReportDefs.REASONMISLEADINGELECTIONS,
          },
          {
            title: l`Other misleading content`,
            reason: OzoneReportDefs.REASONMISLEADINGOTHER,
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
            reason: OzoneReportDefs.REASONSEXUALUNLABELED,
          },
          {
            title: l`Adult sexual abuse content`,
            reason: OzoneReportDefs.REASONSEXUALABUSECONTENT,
          },
          {
            title: l`Non-consensual intimate imagery`,
            reason: OzoneReportDefs.REASONSEXUALNCII,
          },
          {
            title: l`Deepfake adult content`,
            reason: OzoneReportDefs.REASONSEXUALDEEPFAKE,
          },
          {
            title: l`Animal sexual abuse`,
            reason: OzoneReportDefs.REASONSEXUALANIMAL,
          },
          {
            title: l`Other sexual violence content`,
            reason: OzoneReportDefs.REASONSEXUALOTHER,
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
            reason: OzoneReportDefs.REASONHARASSMENTTROLL,
          },
          {
            title: l`Targeted harassment`,
            reason: OzoneReportDefs.REASONHARASSMENTTARGETED,
          },
          {
            title: l`Hate speech`,
            reason: OzoneReportDefs.REASONHARASSMENTHATESPEECH,
          },
          {
            title: l`Doxxing`,
            reason: OzoneReportDefs.REASONHARASSMENTDOXXING,
          },
          {
            title: l`Other harassing or hateful content`,
            reason: OzoneReportDefs.REASONHARASSMENTOTHER,
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
            reason: OzoneReportDefs.REASONVIOLENCEANIMAL,
          },
          {
            title: l`Threats or incitement`,
            reason: OzoneReportDefs.REASONVIOLENCETHREATS,
          },
          {
            title: l`Graphic violent content`,
            reason: OzoneReportDefs.REASONVIOLENCEGRAPHICCONTENT,
          },
          {
            title: l`Glorification of violence`,
            reason: OzoneReportDefs.REASONVIOLENCEGLORIFICATION,
          },
          {
            title: l`Extremist content`,
            reason: OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT,
          },
          {
            title: l`Human trafficking`,
            reason: OzoneReportDefs.REASONVIOLENCETRAFFICKING,
          },
          {
            title: l`Other violent content`,
            reason: OzoneReportDefs.REASONVIOLENCEOTHER,
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
            reason: OzoneReportDefs.REASONCHILDSAFETYCSAM,
          },
          {
            title: l`Grooming or predatory behavior`,
            reason: OzoneReportDefs.REASONCHILDSAFETYGROOM,
          },
          {
            title: l`Privacy violation of a minor`,
            reason: OzoneReportDefs.REASONCHILDSAFETYPRIVACY,
          },
          {
            title: l`Minor harassment or bullying`,
            reason: OzoneReportDefs.REASONCHILDSAFETYHARASSMENT,
          },
          {
            title: l`Other child safety issue`,
            reason: OzoneReportDefs.REASONCHILDSAFETYOTHER,
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
            reason: OzoneReportDefs.REASONSELFHARMCONTENT,
          },
          {
            title: l`Eating disorders`,
            reason: OzoneReportDefs.REASONSELFHARMED,
          },
          {
            title: l`Dangerous challenges or activities`,
            reason: OzoneReportDefs.REASONSELFHARMSTUNTS,
          },
          {
            title: l`Dangerous substances or drug abuse`,
            reason: OzoneReportDefs.REASONSELFHARMSUBSTANCES,
          },
          {
            title: l`Other dangerous content`,
            reason: OzoneReportDefs.REASONSELFHARMOTHER,
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
            reason: OzoneReportDefs.REASONRULESITESECURITY,
          },
          {
            title: l`Promoting or selling prohibited items or services`,
            reason: OzoneReportDefs.REASONRULEPROHIBITEDSALES,
          },
          {
            title: l`Banned user returning`,
            reason: OzoneReportDefs.REASONRULEBANEVASION,
          },
          {
            title: l`Other network rule-breaking`,
            reason: OzoneReportDefs.REASONRULEOTHER,
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
            reason: OzoneReportDefs.REASONOTHER,
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
