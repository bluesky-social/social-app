import {
  ComAtprotoModerationDefs as RootReportDefs,
  ToolsOzoneReportDefs as OzoneReportDefs,
} from '@atproto/api'

export const DMCA_LINK = 'https://bsky.social/about/support/copyright'
export const SUPPORT_PAGE = 'https://bsky.social/about/support'

export const NEW_TO_OLD_REASON_MAPPING: Record<string, string> = {}

/**
 * Mapping of new (Ozone namespace) reason types to old reason types.
 *
 * Matches the mapping defined in the Ozone codebase:
 * @see https://github.com/bluesky-social/atproto/blob/4c15fb47cec26060bff2e710e95869a90c9d7fdd/packages/ozone/src/mod-service/profile.ts#L16-L64
 */
export const NEW_TO_OLD_REASONS_MAP: Record<
  OzoneReportDefs.ReasonType,
  RootReportDefs.ReasonType
> = {
  [OzoneReportDefs.REASONAPPEAL]: RootReportDefs.REASONAPPEAL,
  [OzoneReportDefs.REASONOTHER]: RootReportDefs.REASONOTHER,

  [OzoneReportDefs.REASONVIOLENCEANIMAL]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCETHREATS]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEGRAPHICCONTENT]:
    RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEGLORIFICATION]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT]:
    RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCETRAFFICKING]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONVIOLENCEOTHER]: RootReportDefs.REASONVIOLATION,

  [OzoneReportDefs.REASONSEXUALABUSECONTENT]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALNCII]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALDEEPFAKE]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALANIMAL]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALUNLABELED]: RootReportDefs.REASONSEXUAL,
  [OzoneReportDefs.REASONSEXUALOTHER]: RootReportDefs.REASONSEXUAL,

  [OzoneReportDefs.REASONCHILDSAFETYCSAM]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYGROOM]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYPRIVACY]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYHARASSMENT]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONCHILDSAFETYOTHER]: RootReportDefs.REASONVIOLATION,

  [OzoneReportDefs.REASONHARASSMENTTROLL]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTTARGETED]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTHATESPEECH]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTDOXXING]: RootReportDefs.REASONRUDE,
  [OzoneReportDefs.REASONHARASSMENTOTHER]: RootReportDefs.REASONRUDE,

  [OzoneReportDefs.REASONMISLEADINGBOT]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGIMPERSONATION]:
    RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGSPAM]: RootReportDefs.REASONSPAM,
  [OzoneReportDefs.REASONMISLEADINGSCAM]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGELECTIONS]: RootReportDefs.REASONMISLEADING,
  [OzoneReportDefs.REASONMISLEADINGOTHER]: RootReportDefs.REASONMISLEADING,

  [OzoneReportDefs.REASONRULESITESECURITY]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONRULEPROHIBITEDSALES]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONRULEBANEVASION]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONRULEOTHER]: RootReportDefs.REASONVIOLATION,

  [OzoneReportDefs.REASONSELFHARMCONTENT]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONSELFHARMED]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONSELFHARMSTUNTS]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONSELFHARMSUBSTANCES]: RootReportDefs.REASONVIOLATION,
  [OzoneReportDefs.REASONSELFHARMOTHER]: RootReportDefs.REASONVIOLATION,
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
  [RootReportDefs.REASONOTHER]: [OzoneReportDefs.REASONOTHER],
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
  OzoneReportDefs.REASONSELFHARMOTHER,
  OzoneReportDefs.REASONOTHER,
])

/**
 * Set of report reasons that should only be sent to Bluesky's moderation service.
 */
export const BSKY_LABELER_ONLY_REPORT_REASONS: Set<OzoneReportDefs.ReasonType> =
  new Set([
    OzoneReportDefs.REASONCHILDSAFETYCSAM,
    OzoneReportDefs.REASONCHILDSAFETYGROOM,
    OzoneReportDefs.REASONCHILDSAFETYOTHER,
    OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT,
  ])
