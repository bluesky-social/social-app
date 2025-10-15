import * as OzoneReportDefs from '@atproto/api/dist/client/types/tools/ozone/report/defs'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
  sort: number
  isOther?: boolean
}

export type ReportOption = {
  title: string
  reason: OzoneReportDefs.ReasonType
}

export function useReportOptions() {
  const {_} = useLingui()

  const categories: Record<ReportCategory, ReportCategoryConfig> = {
    childSafety: {
      key: 'childSafety',
      title: _(msg`Child safety`),
      description: _(
        msg`Content harming or endangering minors' safety and wellbeing`,
      ),
      sort: 1,
      options: [
        {
          title: _(msg`Child Sexual Abuse Material (CSAM)`),
          reason: OzoneReportDefs.REASONCHILDSAFETYCSAM,
        },
        {
          title: _(msg`Grooming or predatory behavior`),
          reason: OzoneReportDefs.REASONCHILDSAFETYGROOM,
        },
        {
          title: _(msg`Privacy violation of a minor`),
          reason: OzoneReportDefs.REASONCHILDSAFETYPRIVACY,
        },
        {
          title: _(msg`Minor harassment or bullying`),
          reason: OzoneReportDefs.REASONCHILDSAFETYHARASSMENT,
        },
        {
          title: _(msg`Other child safety issue`),
          reason: OzoneReportDefs.REASONCHILDSAFETYOTHER,
        },
      ],
    },
    violencePhysicalHarm: {
      key: 'violencePhysicalHarm',
      title: _(msg`Violence or physical harm`),
      sort: 2,
      description: _(msg`Threats, calls for violence, or graphic content`),
      options: [
        {
          title: _(msg`Animal welfare`),
          reason: OzoneReportDefs.REASONVIOLENCEANIMAL,
        },
        {
          title: _(msg`Threats or incitement`),
          reason: OzoneReportDefs.REASONVIOLENCETHREATS,
        },
        {
          title: _(msg`Graphic violent content`),
          reason: OzoneReportDefs.REASONVIOLENCEGRAPHICCONTENT,
        },
        {
          title: _(msg`Glorification of violence`),
          reason: OzoneReportDefs.REASONVIOLENCEGLORIFICATION,
        },
        {
          title: _(msg`Extremist content`),
          reason: OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT,
        },
        {
          title: _(msg`Human trafficking`),
          reason: OzoneReportDefs.REASONVIOLENCETRAFFICKING,
        },
        {
          title: _(msg`Other violent content`),
          reason: OzoneReportDefs.REASONVIOLENCEOTHER,
        },
      ],
    },
    sexualAdultContent: {
      key: 'sexualAdultContent',
      title: _(msg`Sexual and adult content`),
      description: _(msg`Adult, child or animal sexual abuse`),
      sort: 3,
      options: [
        {
          title: _(msg`Adult sexual abuse content`),
          reason: OzoneReportDefs.REASONSEXUALABUSECONTENT,
        },
        {
          title: _(msg`Non-consensual intimate imagery`),
          reason: OzoneReportDefs.REASONSEXUALNCII,
        },
        {
          title: _(msg`Deepfake adult content`),
          reason: OzoneReportDefs.REASONSEXUALDEEPFAKE,
        },
        {
          title: _(msg`Animal sexual abuse`),
          reason: OzoneReportDefs.REASONSEXUALANIMAL,
        },
        {
          title: _(msg`Unlabeled adult content`),
          reason: OzoneReportDefs.REASONSEXUALUNLABELED,
        },
        {
          title: _(msg`Other sexual violence content`),
          reason: OzoneReportDefs.REASONSEXUALOTHER,
        },
      ],
    },
    harassmentHate: {
      key: 'harassmentHate',
      title: _(msg`Harassment or hate`),
      description: _(
        msg`Targeted attacks, hate speech, or organized harassment`,
      ),
      sort: 4,
      options: [
        {
          title: _(msg`Trolling`),
          reason: OzoneReportDefs.REASONHARASSMENTTROLL,
        },
        {
          title: _(msg`Targeted harassment`),
          reason: OzoneReportDefs.REASONHARASSMENTTARGETED,
        },
        {
          title: _(msg`Hate speech`),
          reason: OzoneReportDefs.REASONHARASSMENTHATESPEECH,
        },
        {
          title: _(msg`Doxxing`),
          reason: OzoneReportDefs.REASONHARASSMENTDOXXING,
        },
        {
          title: _(msg`Other harassing or hateful content`),
          reason: OzoneReportDefs.REASONHARASSMENTOTHER,
        },
      ],
    },
    misleading: {
      key: 'misleading',
      title: _(msg`Misleading`),
      description: _(msg`Spam, scams, bots, false info, or impersonation`),
      sort: 5,
      options: [
        {
          title: _(msg`Fake account or bot`),
          reason: OzoneReportDefs.REASONMISLEADINGBOT,
        },
        {
          title: _(msg`Impersonation`),
          reason: OzoneReportDefs.REASONMISLEADINGIMPERSONATION,
        },
        {
          title: _(msg`Spam`),
          reason: OzoneReportDefs.REASONMISLEADINGSPAM,
        },
        {
          title: _(msg`Scam`),
          reason: OzoneReportDefs.REASONMISLEADINGSCAM,
        },
        {
          title: _(msg`False information about elections`),
          reason: OzoneReportDefs.REASONMISLEADINGELECTIONS,
        },
        {
          title: _(msg`Other misleading content`),
          reason: OzoneReportDefs.REASONMISLEADINGOTHER,
        },
      ],
    },
    ruleBreaking: {
      key: 'ruleBreaking',
      title: _(msg`Breaking network rules`),
      description: _(msg`Hacking, stolen content, or prohibited sales`),
      sort: 6,
      options: [
        {
          title: _(msg`Hacking or system attacks`),
          reason: OzoneReportDefs.REASONRULESITESECURITY,
        },
        {
          title: _(msg`Promoting or selling prohibited items or services`),
          reason: OzoneReportDefs.REASONRULEPROHIBITEDSALES,
        },
        {
          title: _(msg`Banned user returning`),
          reason: OzoneReportDefs.REASONRULEBANEVASION,
        },
        {
          title: _(msg`Other network rule-breaking`),
          reason: OzoneReportDefs.REASONRULEOTHER,
        },
      ],
    },
    selfHarm: {
      key: 'selfHarm',
      title: _(msg`Self-harm`),
      description: _(msg`Harmful or high-risk activities`),
      sort: 7,
      options: [
        {
          title: _(msg`Content promoting or depicting self-harm`),
          reason: OzoneReportDefs.REASONSELFHARMCONTENT,
        },
        {
          title: _(msg`Eating disorders`),
          reason: OzoneReportDefs.REASONSELFHARMED,
        },
        {
          title: _(msg`Dangerous challenges or activities`),
          reason: OzoneReportDefs.REASONSELFHARMSTUNTS,
        },
        {
          title: _(msg`Dangerous substances or drug abuse`),
          reason: OzoneReportDefs.REASONSELFHARMSUBSTANCES,
        },
        {
          title: _(msg`Other dangerous content`),
          reason: OzoneReportDefs.REASONSELFHARMOTHER,
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
          reason: OzoneReportDefs.REASONOTHER,
        },
      ],
      isOther: true,
    },
  }

  const sortedCategories = (
    Object.values(categories) as ReportCategoryConfig[]
  ).sort((a, b) => a.sort - b.sort)

  const getCategory = (reasonName: ReportCategory) => {
    return categories[reasonName]
  }

  return {categories, sortedCategories, getCategory}
}
