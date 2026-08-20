import {applicationId} from 'expo-application'

import {type ParsedReportSubject} from '#/components/moderation/ReportDialog/types'
import {IS_ANDROID, IS_IOS, IS_WEB} from '#/env'
import * as ComAtprotoModerationDefs from '#/lexicons/com/atproto/moderation/defs'
import * as ToolsOzoneReportDefs from '#/lexicons/tools/ozone/report/defs'

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
  ToolsOzoneReportDefs.ReasonType,
  ComAtprotoModerationDefs.ReasonType
> = {
  [ToolsOzoneReportDefs.reasonAppeal.value]:
    ComAtprotoModerationDefs.reasonAppeal.value,
  [ToolsOzoneReportDefs.reasonOther.value]:
    ComAtprotoModerationDefs.reasonOther.value,

  [ToolsOzoneReportDefs.reasonViolenceAnimal.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonViolenceThreats.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonViolenceGraphicContent.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonViolenceGlorification.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonViolenceExtremistContent.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonViolenceTrafficking.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonViolenceOther.value]:
    ComAtprotoModerationDefs.reasonViolation.value,

  [ToolsOzoneReportDefs.reasonSexualAbuseContent.value]:
    ComAtprotoModerationDefs.reasonSexual.value,
  [ToolsOzoneReportDefs.reasonSexualNCII.value]:
    ComAtprotoModerationDefs.reasonSexual.value,
  [ToolsOzoneReportDefs.reasonSexualDeepfake.value]:
    ComAtprotoModerationDefs.reasonSexual.value,
  [ToolsOzoneReportDefs.reasonSexualAnimal.value]:
    ComAtprotoModerationDefs.reasonSexual.value,
  [ToolsOzoneReportDefs.reasonSexualUnlabeled.value]:
    ComAtprotoModerationDefs.reasonSexual.value,
  [ToolsOzoneReportDefs.reasonSexualOther.value]:
    ComAtprotoModerationDefs.reasonSexual.value,

  [ToolsOzoneReportDefs.reasonChildSafetyCSAM.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonChildSafetyGroom.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonChildSafetyPrivacy.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonChildSafetyHarassment.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonChildSafetyOther.value]:
    ComAtprotoModerationDefs.reasonViolation.value,

  [ToolsOzoneReportDefs.reasonHarassmentTroll.value]:
    ComAtprotoModerationDefs.reasonRude.value,
  [ToolsOzoneReportDefs.reasonHarassmentTargeted.value]:
    ComAtprotoModerationDefs.reasonRude.value,
  [ToolsOzoneReportDefs.reasonHarassmentHateSpeech.value]:
    ComAtprotoModerationDefs.reasonRude.value,
  [ToolsOzoneReportDefs.reasonHarassmentDoxxing.value]:
    ComAtprotoModerationDefs.reasonRude.value,
  [ToolsOzoneReportDefs.reasonHarassmentOther.value]:
    ComAtprotoModerationDefs.reasonRude.value,

  [ToolsOzoneReportDefs.reasonMisleadingBot.value]:
    ComAtprotoModerationDefs.reasonMisleading.value,
  [ToolsOzoneReportDefs.reasonMisleadingImpersonation.value]:
    ComAtprotoModerationDefs.reasonMisleading.value,
  [ToolsOzoneReportDefs.reasonMisleadingSpam.value]:
    ComAtprotoModerationDefs.reasonSpam.value,
  [ToolsOzoneReportDefs.reasonMisleadingScam.value]:
    ComAtprotoModerationDefs.reasonMisleading.value,
  [ToolsOzoneReportDefs.reasonMisleadingElections.value]:
    ComAtprotoModerationDefs.reasonMisleading.value,
  [ToolsOzoneReportDefs.reasonMisleadingOther.value]:
    ComAtprotoModerationDefs.reasonMisleading.value,

  [ToolsOzoneReportDefs.reasonRuleSiteSecurity.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonRuleProhibitedSales.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonRuleBanEvasion.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonRuleOther.value]:
    ComAtprotoModerationDefs.reasonViolation.value,

  [ToolsOzoneReportDefs.reasonSelfHarmContent.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonSelfHarmED.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonSelfHarmStunts.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonSelfHarmSubstances.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
  [ToolsOzoneReportDefs.reasonSelfHarmOther.value]:
    ComAtprotoModerationDefs.reasonViolation.value,
}

/**
 * Mapping of old reason types to new (Ozone namespace) reason types.
 * @see https://github.com/bluesky-social/proposals/tree/main/0009-mod-report-granularity#backwards-compatibility
 */
export const OLD_TO_NEW_REASONS_MAP: Record<
  Exclude<ComAtprotoModerationDefs.ReasonType, ToolsOzoneReportDefs.ReasonType>,
  ToolsOzoneReportDefs.ReasonType
> = {
  [ComAtprotoModerationDefs.reasonSpam.value]: [
    ToolsOzoneReportDefs.reasonMisleadingSpam.value,
  ],
  [ComAtprotoModerationDefs.reasonViolation.value]: [
    ToolsOzoneReportDefs.reasonRuleOther.value,
  ],
  [ComAtprotoModerationDefs.reasonMisleading.value]: [
    ToolsOzoneReportDefs.reasonMisleadingOther.value,
  ],
  [ComAtprotoModerationDefs.reasonSexual.value]: [
    ToolsOzoneReportDefs.reasonSexualUnlabeled.value,
  ],
  [ComAtprotoModerationDefs.reasonRude.value]: [
    ToolsOzoneReportDefs.reasonHarassmentOther.value,
  ],
  [ComAtprotoModerationDefs.reasonOther.value]: [
    ToolsOzoneReportDefs.reasonOther.value,
  ],
  [ComAtprotoModerationDefs.reasonAppeal.value]: [
    ToolsOzoneReportDefs.reasonAppeal.value,
  ],
}

/**
 * Set of report reasons that should optionally include additional details from
 * the reporter.
 */
export const OTHER_REPORT_REASONS: Set<ToolsOzoneReportDefs.ReasonType> =
  new Set([
    ToolsOzoneReportDefs.reasonViolenceOther.value,
    ToolsOzoneReportDefs.reasonSexualOther.value,
    ToolsOzoneReportDefs.reasonChildSafetyOther.value,
    ToolsOzoneReportDefs.reasonHarassmentOther.value,
    ToolsOzoneReportDefs.reasonMisleadingOther.value,
    ToolsOzoneReportDefs.reasonRuleOther.value,
    ToolsOzoneReportDefs.reasonSelfHarmOther.value,
    ToolsOzoneReportDefs.reasonOther.value,
  ])

/**
 * Set of report reasons that should only be sent to Bluesky's moderation service.
 */
export const BSKY_LABELER_ONLY_REPORT_REASONS: Set<ToolsOzoneReportDefs.ReasonType> =
  new Set([
    ToolsOzoneReportDefs.reasonChildSafetyCSAM.value,
    ToolsOzoneReportDefs.reasonChildSafetyGroom.value,
    ToolsOzoneReportDefs.reasonChildSafetyOther.value,
    ToolsOzoneReportDefs.reasonViolenceExtremistContent.value,
  ])

/**
 * Set of _parsed_ subject types that should only be sent to Bluesky's
 * moderation service.
 */
export const BSKY_LABELER_ONLY_SUBJECT_TYPES: Set<ParsedReportSubject['type']> =
  new Set(['convoMessage', 'convo', 'status'])
