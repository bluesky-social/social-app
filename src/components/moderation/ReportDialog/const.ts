import {applicationId} from 'expo-application'
import {com, tools} from '#/lexicons'
import {type ParsedReportSubject} from '#/components/moderation/ReportDialog/types'
import {IS_ANDROID, IS_IOS, IS_WEB} from '#/env'

export const DMCA_LINK = 'https://bsky.social/about/support/copyright'
export const SUPPORT_PAGE = 'https://bsky.social/about/support'
export const NCII_FORM = 'https://forms.bsky.app/f/ncii'

/**
 * Identifies this client as the source of a report.
 */
export const REPORT_MOD_TOOL_NAME = IS_IOS
  ? `bsky-app/ios/${applicationId}`
  : IS_ANDROID
    ? `bsky-app/android/${applicationId}`
    : IS_WEB
      ? `bsky-web/${window.location.hostname}`
      : 'bsky' // Should never occur

export const NEW_TO_OLD_REASON_MAPPING: Record<string, string> = {}

/**
 * Mapping of new (Ozone namespace) reason types to old reason types.
 *
 * Matches the mapping defined in the Ozone codebase:
 * @see https://github.com/bluesky-social/atproto/blob/4c15fb47cec26060bff2e710e95869a90c9d7fdd/packages/ozone/src/mod-service/profile.ts#L16-L64
 */
export const NEW_TO_OLD_REASONS_MAP: Record<
  tools.ozone.report.defs.ReasonType,
  com.atproto.moderation.defs.ReasonType
> = {
  [tools.ozone.report.defs.reasonAppeal]:
    com.atproto.moderation.defs.reasonAppeal,
  [tools.ozone.report.defs.reasonOther]:
    com.atproto.moderation.defs.reasonOther,

  [tools.ozone.report.defs.reasonViolenceAnimal]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonViolenceThreats]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonViolenceGraphicContent]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonViolenceGlorification]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonViolenceExtremistContent]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonViolenceTrafficking]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonViolenceOther]:
    com.atproto.moderation.defs.reasonViolation,

  [tools.ozone.report.defs.reasonSexualAbuseContent]:
    com.atproto.moderation.defs.reasonSexual,
  [tools.ozone.report.defs.reasonSexualNCII]:
    com.atproto.moderation.defs.reasonSexual,
  [tools.ozone.report.defs.reasonSexualDeepfake]:
    com.atproto.moderation.defs.reasonSexual,
  [tools.ozone.report.defs.reasonSexualAnimal]:
    com.atproto.moderation.defs.reasonSexual,
  [tools.ozone.report.defs.reasonSexualUnlabeled]:
    com.atproto.moderation.defs.reasonSexual,
  [tools.ozone.report.defs.reasonSexualOther]:
    com.atproto.moderation.defs.reasonSexual,

  [tools.ozone.report.defs.reasonChildSafetyCSAM]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonChildSafetyGroom]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonChildSafetyPrivacy]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonChildSafetyHarassment]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonChildSafetyOther]:
    com.atproto.moderation.defs.reasonViolation,

  [tools.ozone.report.defs.reasonHarassmentTroll]:
    com.atproto.moderation.defs.reasonRude,
  [tools.ozone.report.defs.reasonHarassmentTargeted]:
    com.atproto.moderation.defs.reasonRude,
  [tools.ozone.report.defs.reasonHarassmentHateSpeech]:
    com.atproto.moderation.defs.reasonRude,
  [tools.ozone.report.defs.reasonHarassmentDoxxing]:
    com.atproto.moderation.defs.reasonRude,
  [tools.ozone.report.defs.reasonHarassmentOther]:
    com.atproto.moderation.defs.reasonRude,

  [tools.ozone.report.defs.reasonMisleadingBot]:
    com.atproto.moderation.defs.reasonMisleading,
  [tools.ozone.report.defs.reasonMisleadingImpersonation]:
    com.atproto.moderation.defs.reasonMisleading,
  [tools.ozone.report.defs.reasonMisleadingSpam]:
    com.atproto.moderation.defs.reasonSpam,
  [tools.ozone.report.defs.reasonMisleadingScam]:
    com.atproto.moderation.defs.reasonMisleading,
  [tools.ozone.report.defs.reasonMisleadingElections]:
    com.atproto.moderation.defs.reasonMisleading,
  [tools.ozone.report.defs.reasonMisleadingOther]:
    com.atproto.moderation.defs.reasonMisleading,

  [tools.ozone.report.defs.reasonRuleSiteSecurity]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonRuleProhibitedSales]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonRuleBanEvasion]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonRuleOther]:
    com.atproto.moderation.defs.reasonViolation,

  [tools.ozone.report.defs.reasonSelfHarmContent]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonSelfHarmED]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonSelfHarmStunts]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonSelfHarmSubstances]:
    com.atproto.moderation.defs.reasonViolation,
  [tools.ozone.report.defs.reasonSelfHarmOther]:
    com.atproto.moderation.defs.reasonViolation,
}

/**
 * Mapping of old reason types to new (Ozone namespace) reason types.
 * @see https://github.com/bluesky-social/proposals/tree/main/0009-mod-report-granularity#backwards-compatibility
 */
export const OLD_TO_NEW_REASONS_MAP: Record<
  Exclude<
    com.atproto.moderation.defs.ReasonType,
    tools.ozone.report.defs.ReasonType
  >,
  tools.ozone.report.defs.ReasonType
> = {
  [com.atproto.moderation.defs.reasonSpam]: [
    tools.ozone.report.defs.reasonMisleadingSpam,
  ],
  [com.atproto.moderation.defs.reasonViolation]: [
    tools.ozone.report.defs.reasonRuleOther,
  ],
  [com.atproto.moderation.defs.reasonMisleading]: [
    tools.ozone.report.defs.reasonMisleadingOther,
  ],
  [com.atproto.moderation.defs.reasonSexual]: [
    tools.ozone.report.defs.reasonSexualUnlabeled,
  ],
  [com.atproto.moderation.defs.reasonRude]: [
    tools.ozone.report.defs.reasonHarassmentOther,
  ],
  [com.atproto.moderation.defs.reasonOther]: [
    tools.ozone.report.defs.reasonOther,
  ],
  [com.atproto.moderation.defs.reasonAppeal]: [
    tools.ozone.report.defs.reasonAppeal,
  ],
}

/**
 * Set of report reasons that should optionally include additional details from
 * the reporter.
 */
export const OTHER_REPORT_REASONS: Set<tools.ozone.report.defs.ReasonType> =
  new Set([
    tools.ozone.report.defs.reasonViolenceOther,
    tools.ozone.report.defs.reasonSexualOther,
    tools.ozone.report.defs.reasonChildSafetyOther,
    tools.ozone.report.defs.reasonHarassmentOther,
    tools.ozone.report.defs.reasonMisleadingOther,
    tools.ozone.report.defs.reasonRuleOther,
    tools.ozone.report.defs.reasonSelfHarmOther,
    tools.ozone.report.defs.reasonOther,
  ])

/**
 * Set of report reasons that should only be sent to Bluesky's moderation service.
 */
export const BSKY_LABELER_ONLY_REPORT_REASONS: Set<tools.ozone.report.defs.ReasonType> =
  new Set([
    tools.ozone.report.defs.reasonChildSafetyCSAM,
    tools.ozone.report.defs.reasonChildSafetyGroom,
    tools.ozone.report.defs.reasonChildSafetyOther,
    tools.ozone.report.defs.reasonViolenceExtremistContent,
  ])

/**
 * Set of _parsed_ subject types that should only be sent to Bluesky's
 * moderation service.
 */
export const BSKY_LABELER_ONLY_SUBJECT_TYPES: Set<ParsedReportSubject['type']> =
  new Set(['convoMessage', 'convo', 'status'])
