import * as RootReportDefs from '@atproto/api/dist/client/types/com/atproto/moderation/defs'
import * as OzoneReportDefs from '@atproto/api/dist/client/types/tools/ozone/report/defs'

export const DMCA_LINK = 'https://bsky.social/about/support/copyright'
export const SUPPORT_PAGE = 'https://bsky.social/about/support'

export const NEW_TO_OLD_REASON_MAPPING: Record<string, string> = {}

/**
 * Mapping of new (Ozone namespace) reason types to old reason types.
 *
 * Matches the mapping defined in the Ozone codebase:
 * @see https://github.com/bluesky-social/atproto/blob/09439d7d688294ad1a0c78a74b901ba2f7c5f4c3/packages/ozone/src/mod-service/profile.ts#L15
 */
export const NEW_TO_OLD_REASONS_MAP: Record<
  OzoneReportDefs.ReasonType,
  RootReportDefs.ReasonType
> = {
  [OzoneReportDefs.REASONAPPEAL]: RootReportDefs.REASONAPPEAL,

  // Violence-related
  [OzoneReportDefs.REASONVIOLENCEANIMALWELFARE]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCETHREATS]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEGRAPHICCONTENT]:
    RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCESELFHARM]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEGLORIFICATION]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT]:
    RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCETRAFFICKING]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEOTHER]: RootReportDefs.REASONVIOLATION,

  // Sexual-related
  [OzoneReportDefs.REASONSEXUALABUSECONTENT]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALNCII]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALSEXTORTION]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALDEEPFAKE]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALANIMAL]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALUNLABELED]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALOTHER]: RootReportDefs.REASONSEXUAL,

  // Child safety
  [OzoneReportDefs.REASONCHILDSAFETYCSAM]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYGROOM]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYMINORPRIVACY]:
    RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYENDANGERMENT]:
    RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYHARASSMENT]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYPROMOTION]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYOTHER]: RootReportDefs.REASONVIOLATION,

  // Harassment
  [OzoneReportDefs.REASONHARASSMENTTROLL]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTTARGETED]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTHATESPEECH]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTDOXXING]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTOTHER]: RootReportDefs.REASONRUDE,

  // Misleading
  [OzoneReportDefs.REASONMISLEADINGSPAM]: RootReportDefs.REASONSPAM,
  [OzoneReportDefs.REASONMISLEADINGBOT]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGIMPERSONATION]:
    RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGSCAM]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGSYNTHETICCONTENT]:
    RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGMISINFORMATION]:
    RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGOTHER]: RootReportDefs.REASONMISLEADING,

  // Map all rule-related reasons to REASONVIOLATION
  [OzoneReportDefs.REASONRULESITESECURITY]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONRULESTOLENCONTENT]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONRULEPROHIBITEDSALES]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONRULEBANEVASION]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONRULEOTHER]: RootReportDefs.REASONVIOLATION,

  // Information Integrity
  [OzoneReportDefs.REASONCIVICELECTORALPROCESS]:
    RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONCIVICDISCLOSURE]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONCIVICINTERFERENCE]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONCIVICMISINFORMATION]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONCIVICIMPERSONATION]: RootReportDefs.REASONMISLEADING,
}

/**
 * Mapping of old reason types to new (Ozone namespace) reason types.
 * @see https://github.com/bluesky-social/proposals/tree/main/0009-mod-report-granularity#backwards-compatibility
 */
export const OLD_TO_NEW_REASONS_MAP: Record<
  Exclude<RootReportDefs.ReasonType, OzoneReportDefs.ReasonType>,
  OzoneReportDefs.ReasonType
> = {
  [RootReportDefs.REASONSPAM]: [OzoneReportDefs.REASONMISLEADINGSPAM],
  [RootReportDefs.REASONVIOLATION]: [OzoneReportDefs.REASONRULEOTHER],
  [RootReportDefs.REASONMISLEADING]: [OzoneReportDefs.REASONMISLEADINGOTHER],
  [RootReportDefs.REASONSEXUAL]: [OzoneReportDefs.REASONSEXUALUNLABELED],
  [RootReportDefs.REASONRUDE]: [OzoneReportDefs.REASONHARASSMENTOTHER],
  [RootReportDefs.REASONOTHER]: [OzoneReportDefs.REASONRULEOTHER],
  [RootReportDefs.REASONAPPEAL]: [OzoneReportDefs.REASONAPPEAL],
}

/**
 * Set of report reasons that should optionally include additional details from
 * the reporter.
 */
export const OTHER_REPORT_REASONS: Set<OzoneReportDefs.ReasonType> = new Set([
  OzoneReportDefs.REASONVIOLENCEOTHER,
  OzoneReportDefs.REASONSEXUALOTHER,
  OzoneReportDefs.REASONCHILDSAFETYOTHER,
  OzoneReportDefs.REASONHARASSMENTOTHER,
  OzoneReportDefs.REASONMISLEADINGOTHER,
  OzoneReportDefs.REASONRULEOTHER,
])

/**
 * Set of report reasons that should only be sent to moderation authorities,
 * such as Bluesky.
 */
export const MOD_AUTHORITY_ONLY_REPORT_REASONS: Set<OzoneReportDefs.ReasonType> =
  new Set([
    OzoneReportDefs.REASONCHILDSAFETYCSAM,
    OzoneReportDefs.REASONCHILDSAFETYGROOM,
    OzoneReportDefs.REASONCHILDSAFETYENDANGERMENT,
    OzoneReportDefs.REASONCHILDSAFETYPROMOTION,
    OzoneReportDefs.REASONCHILDSAFETYOTHER,
    OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT,
  ])
