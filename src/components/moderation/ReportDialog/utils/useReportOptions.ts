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
  | 'civicIntegrity'
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
      title: _(msg`Child Safety`),
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
          title: _(msg`Grooming or Predatory Behavior`),
          reason: OzoneReportDefs.REASONCHILDSAFETYGROOM,
        },
        {
          title: _(msg`Minor Privacy Violation`),
          reason: OzoneReportDefs.REASONCHILDSAFETYMINORPRIVACY,
        },
        {
          title: _(msg`Child Endangerment`),
          reason: OzoneReportDefs.REASONCHILDSAFETYENDANGERMENT,
        },
        {
          title: _(msg`Minor Harassment or Bullying`),
          reason: OzoneReportDefs.REASONCHILDSAFETYHARASSMENT,
        },
        {
          title: _(msg`Promotion of Child Exploitation`),
          reason: OzoneReportDefs.REASONCHILDSAFETYPROMOTION,
        },
        {
          title: _(msg`Other Child Safety Issue`),
          reason: OzoneReportDefs.REASONCHILDSAFETYOTHER,
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
          reason: OzoneReportDefs.REASONVIOLENCEANIMALWELFARE,
        },
        {
          title: _(msg`Threats or Incitement`),
          reason: OzoneReportDefs.REASONVIOLENCETHREATS,
        },
        {
          title: _(msg`Graphic Violent Content`),
          reason: OzoneReportDefs.REASONVIOLENCEGRAPHICCONTENT,
        },
        {
          title: _(msg`Self Harm`),
          reason: OzoneReportDefs.REASONVIOLENCESELFHARM,
        },
        {
          title: _(msg`Glorification of Violence`),
          reason: OzoneReportDefs.REASONVIOLENCEGLORIFICATION,
        },
        {
          title: _(msg`Extremist Content`),
          reason: OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT,
        },
        {
          title: _(msg`Human Trafficking`),
          reason: OzoneReportDefs.REASONVIOLENCETRAFFICKING,
        },
        {
          title: _(msg`Other Violent Content`),
          reason: OzoneReportDefs.REASONVIOLENCEOTHER,
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
          reason: OzoneReportDefs.REASONSEXUALABUSECONTENT,
        },
        {
          title: _(msg`Non-Consensual Intimate Imagery`),
          reason: OzoneReportDefs.REASONSEXUALNCII,
        },
        {
          title: _(msg`Sextortion`),
          reason: OzoneReportDefs.REASONSEXUALSEXTORTION,
        },
        {
          title: _(msg`Deepfake Adult Content`),
          reason: OzoneReportDefs.REASONSEXUALDEEPFAKE,
        },
        {
          title: _(msg`Animal Sexual Abuse`),
          reason: OzoneReportDefs.REASONSEXUALANIMAL,
        },
        {
          title: _(msg`Unlabeled Adult Content`),
          reason: OzoneReportDefs.REASONSEXUALUNLABELED,
        },
        {
          title: _(msg`Other Sexual Violence Content`),
          reason: OzoneReportDefs.REASONSEXUALOTHER,
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
          reason: OzoneReportDefs.REASONHARASSMENTTROLL,
        },
        {
          title: _(msg`Targeted Harassment`),
          reason: OzoneReportDefs.REASONHARASSMENTTARGETED,
        },
        {
          title: _(msg`Hate Speech`),
          reason: OzoneReportDefs.REASONHARASSMENTHATESPEECH,
        },
        {
          title: _(msg`Doxxing`),
          reason: OzoneReportDefs.REASONHARASSMENTDOXXING,
        },
        {
          title: _(msg`Other Harassing or Hateful Content`),
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
          title: _(msg`Fake Account or Bot`),
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
          title: _(msg`Unlabeled Generative AI or Synthetic Content`),
          reason: OzoneReportDefs.REASONMISLEADINGSYNTHETICCONTENT,
        },
        {
          title: _(msg`Harmful False Claims`),
          reason: OzoneReportDefs.REASONMISLEADINGMISINFORMATION,
        },
        {
          title: _(msg`Other Misleading Content`),
          reason: OzoneReportDefs.REASONMISLEADINGOTHER,
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
          reason: OzoneReportDefs.REASONRULESITESECURITY,
        },
        {
          title: _(msg`Stolen Content`),
          reason: OzoneReportDefs.REASONRULESTOLENCONTENT,
        },
        {
          title: _(msg`Promoting or Selling Prohibited Items or Services`),
          reason: OzoneReportDefs.REASONRULEPROHIBITEDSALES,
        },
        {
          title: _(msg`Banned User Returning`),
          reason: OzoneReportDefs.REASONRULEBANEVASION,
        },
        {
          title: _(msg`Other Network Rule-breaking`),
          reason: OzoneReportDefs.REASONRULEOTHER,
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
          reason: OzoneReportDefs.REASONCIVICELECTORALPROCESS,
        },
        {
          title: _(msg`Disclosure and Transparency Violations`),
          reason: OzoneReportDefs.REASONCIVICDISCLOSURE,
        },
        {
          title: _(msg`Voter Intimidation or Interference`),
          reason: OzoneReportDefs.REASONCIVICINTERFERENCE,
        },
        {
          title: _(msg`Election Misinformation`),
          reason: OzoneReportDefs.REASONCIVICMISINFORMATION,
        },
        {
          title: _(msg`Impersonation of Electoral Officials or Entities`),
          reason: OzoneReportDefs.REASONCIVICIMPERSONATION,
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
          reason: OzoneReportDefs.REASONRULEOTHER,
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
