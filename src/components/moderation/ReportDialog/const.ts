import {type ParsedReportSubject} from '#/components/moderation/ReportDialog/types'
import {com, tools} from '#/lexicons'

const OzoneReportDefs = tools.ozone.report.defs
const RootReportDefs = com.atproto.moderation.defs

type OzoneReasonType = tools.ozone.report.defs.ReasonType
type RootReasonType = com.atproto.moderation.defs.ReasonType

export const DMCA_LINK = 'https://bsky.social/about/support/copyright'
export const SUPPORT_PAGE = 'https://bsky.social/about/support'

export const NEW_TO_OLD_REASON_MAPPING: Record<string, string> = {}

/**
 * Mapping of new (Ozone namespace) reason types to old reason types.
 *
 * Matches the mapping defined in the Ozone codebase:
 * @see https://github.com/bluesky-social/atproto/blob/4c15fb47cec26060bff2e710e95869a90c9d7fdd/packages/ozone/src/mod-service/profile.ts#L16-L64
 */
export const NEW_TO_OLD_REASONS_MAP: Record<OzoneReasonType, RootReasonType> = {
  [OzoneReportDefs.reasonAppeal.value]: RootReportDefs.reasonAppeal.value,
  [OzoneReportDefs.reasonOther.value]: RootReportDefs.reasonOther.value,

  [OzoneReportDefs.reasonViolenceAnimal.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonViolenceThreats.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonViolenceGraphicContent.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonViolenceGlorification.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonViolenceExtremistContent.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonViolenceTrafficking.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonViolenceOther.value]:
    RootReportDefs.reasonViolation.value,

  [OzoneReportDefs.reasonSexualAbuseContent.value]:
    RootReportDefs.reasonSexual.value,
  [OzoneReportDefs.reasonSexualNCII.value]: RootReportDefs.reasonSexual.value,
  [OzoneReportDefs.reasonSexualDeepfake.value]:
    RootReportDefs.reasonSexual.value,
  [OzoneReportDefs.reasonSexualAnimal.value]: RootReportDefs.reasonSexual.value,
  [OzoneReportDefs.reasonSexualUnlabeled.value]:
    RootReportDefs.reasonSexual.value,
  [OzoneReportDefs.reasonSexualOther.value]: RootReportDefs.reasonSexual.value,

  [OzoneReportDefs.reasonChildSafetyCSAM.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonChildSafetyGroom.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonChildSafetyPrivacy.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonChildSafetyHarassment.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonChildSafetyOther.value]:
    RootReportDefs.reasonViolation.value,

  [OzoneReportDefs.reasonHarassmentTroll.value]:
    RootReportDefs.reasonRude.value,
  [OzoneReportDefs.reasonHarassmentTargeted.value]:
    RootReportDefs.reasonRude.value,
  [OzoneReportDefs.reasonHarassmentHateSpeech.value]:
    RootReportDefs.reasonRude.value,
  [OzoneReportDefs.reasonHarassmentDoxxing.value]:
    RootReportDefs.reasonRude.value,
  [OzoneReportDefs.reasonHarassmentOther.value]:
    RootReportDefs.reasonRude.value,

  [OzoneReportDefs.reasonMisleadingBot.value]:
    RootReportDefs.reasonMisleading.value,
  [OzoneReportDefs.reasonMisleadingImpersonation.value]:
    RootReportDefs.reasonMisleading.value,
  [OzoneReportDefs.reasonMisleadingSpam.value]: RootReportDefs.reasonSpam.value,
  [OzoneReportDefs.reasonMisleadingScam.value]:
    RootReportDefs.reasonMisleading.value,
  [OzoneReportDefs.reasonMisleadingElections.value]:
    RootReportDefs.reasonMisleading.value,
  [OzoneReportDefs.reasonMisleadingOther.value]:
    RootReportDefs.reasonMisleading.value,

  [OzoneReportDefs.reasonRuleSiteSecurity.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonRuleProhibitedSales.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonRuleBanEvasion.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonRuleOther.value]: RootReportDefs.reasonViolation.value,

  [OzoneReportDefs.reasonSelfHarmContent.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonSelfHarmED.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonSelfHarmStunts.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonSelfHarmSubstances.value]:
    RootReportDefs.reasonViolation.value,
  [OzoneReportDefs.reasonSelfHarmOther.value]:
    RootReportDefs.reasonViolation.value,
}

/**
 * Mapping of old reason types to new (Ozone namespace) reason types.
 * @see https://github.com/bluesky-social/proposals/tree/main/0009-mod-report-granularity#backwards-compatibility
 */
export const OLD_TO_NEW_REASONS_MAP: Record<
  Exclude<RootReasonType, OzoneReasonType>,
  OzoneReasonType
> = {
  [RootReportDefs.reasonSpam.value]: OzoneReportDefs.reasonMisleadingSpam.value,
  [RootReportDefs.reasonViolation.value]: OzoneReportDefs.reasonRuleOther.value,
  [RootReportDefs.reasonMisleading.value]:
    OzoneReportDefs.reasonMisleadingOther.value,
  [RootReportDefs.reasonSexual.value]:
    OzoneReportDefs.reasonSexualUnlabeled.value,
  [RootReportDefs.reasonRude.value]:
    OzoneReportDefs.reasonHarassmentOther.value,
  [RootReportDefs.reasonOther.value]: OzoneReportDefs.reasonOther.value,
  [RootReportDefs.reasonAppeal.value]: OzoneReportDefs.reasonAppeal.value,
}

/**
 * Set of report reasons that should optionally include additional details from
 * the reporter.
 */
export const OTHER_REPORT_REASONS: Set<OzoneReasonType> = new Set([
  OzoneReportDefs.reasonViolenceOther.value,
  OzoneReportDefs.reasonSexualOther.value,
  OzoneReportDefs.reasonChildSafetyOther.value,
  OzoneReportDefs.reasonHarassmentOther.value,
  OzoneReportDefs.reasonMisleadingOther.value,
  OzoneReportDefs.reasonRuleOther.value,
  OzoneReportDefs.reasonSelfHarmOther.value,
  OzoneReportDefs.reasonOther.value,
])

/**
 * Set of report reasons that should only be sent to Bluesky's moderation service.
 */
export const BSKY_LABELER_ONLY_REPORT_REASONS: Set<OzoneReasonType> = new Set([
  OzoneReportDefs.reasonChildSafetyCSAM.value,
  OzoneReportDefs.reasonChildSafetyGroom.value,
  OzoneReportDefs.reasonChildSafetyOther.value,
  OzoneReportDefs.reasonViolenceExtremistContent.value,
])

/**
 * Set of _parsed_ subject types that should only be sent to Bluesky's
 * moderation service.
 */
export const BSKY_LABELER_ONLY_SUBJECT_TYPES: Set<ParsedReportSubject['type']> =
  new Set(['convoMessage', 'convo', 'status'])
