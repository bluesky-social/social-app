import {applicationId} from 'expo-application'

import {type ParsedReportSubject} from '#/components/moderation/ReportDialog/types'
import {IS_ANDROID, IS_IOS, IS_WEB} from '#/env'
import {com, tools} from '#/lexicons'

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
  [tools.ozone.report.defs.reasonAppeal.value]:
    com.atproto.moderation.defs.reasonAppeal.value,
  [tools.ozone.report.defs.reasonOther.value]:
    com.atproto.moderation.defs.reasonOther.value,

  [tools.ozone.report.defs.reasonViolenceAnimal.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonViolenceThreats.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonViolenceGraphicContent.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonViolenceGlorification.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonViolenceExtremistContent.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonViolenceTrafficking.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonViolenceOther.value]:
    com.atproto.moderation.defs.reasonViolation.value,

  [tools.ozone.report.defs.reasonSexualAbuseContent.value]:
    com.atproto.moderation.defs.reasonSexual.value,
  [tools.ozone.report.defs.reasonSexualNCII.value]:
    com.atproto.moderation.defs.reasonSexual.value,
  [tools.ozone.report.defs.reasonSexualDeepfake.value]:
    com.atproto.moderation.defs.reasonSexual.value,
  [tools.ozone.report.defs.reasonSexualAnimal.value]:
    com.atproto.moderation.defs.reasonSexual.value,
  [tools.ozone.report.defs.reasonSexualUnlabeled.value]:
    com.atproto.moderation.defs.reasonSexual.value,
  [tools.ozone.report.defs.reasonSexualOther.value]:
    com.atproto.moderation.defs.reasonSexual.value,

  [tools.ozone.report.defs.reasonChildSafetyCSAM.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonChildSafetyGroom.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonChildSafetyPrivacy.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonChildSafetyHarassment.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonChildSafetyOther.value]:
    com.atproto.moderation.defs.reasonViolation.value,

  [tools.ozone.report.defs.reasonHarassmentTroll.value]:
    com.atproto.moderation.defs.reasonRude.value,
  [tools.ozone.report.defs.reasonHarassmentTargeted.value]:
    com.atproto.moderation.defs.reasonRude.value,
  [tools.ozone.report.defs.reasonHarassmentHateSpeech.value]:
    com.atproto.moderation.defs.reasonRude.value,
  [tools.ozone.report.defs.reasonHarassmentDoxxing.value]:
    com.atproto.moderation.defs.reasonRude.value,
  [tools.ozone.report.defs.reasonHarassmentOther.value]:
    com.atproto.moderation.defs.reasonRude.value,

  [tools.ozone.report.defs.reasonMisleadingBot.value]:
    com.atproto.moderation.defs.reasonMisleading.value,
  [tools.ozone.report.defs.reasonMisleadingImpersonation.value]:
    com.atproto.moderation.defs.reasonMisleading.value,
  [tools.ozone.report.defs.reasonMisleadingSpam.value]:
    com.atproto.moderation.defs.reasonSpam.value,
  [tools.ozone.report.defs.reasonMisleadingScam.value]:
    com.atproto.moderation.defs.reasonMisleading.value,
  [tools.ozone.report.defs.reasonMisleadingElections.value]:
    com.atproto.moderation.defs.reasonMisleading.value,
  [tools.ozone.report.defs.reasonMisleadingOther.value]:
    com.atproto.moderation.defs.reasonMisleading.value,

  [tools.ozone.report.defs.reasonRuleSiteSecurity.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonRuleProhibitedSales.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonRuleBanEvasion.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonRuleOther.value]:
    com.atproto.moderation.defs.reasonViolation.value,

  [tools.ozone.report.defs.reasonSelfHarmContent.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonSelfHarmED.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonSelfHarmStunts.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonSelfHarmSubstances.value]:
    com.atproto.moderation.defs.reasonViolation.value,
  [tools.ozone.report.defs.reasonSelfHarmOther.value]:
    com.atproto.moderation.defs.reasonViolation.value,
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
  [com.atproto.moderation.defs.reasonSpam.value]: [
    tools.ozone.report.defs.reasonMisleadingSpam.value,
  ],
  [com.atproto.moderation.defs.reasonViolation.value]: [
    tools.ozone.report.defs.reasonRuleOther.value,
  ],
  [com.atproto.moderation.defs.reasonMisleading.value]: [
    tools.ozone.report.defs.reasonMisleadingOther.value,
  ],
  [com.atproto.moderation.defs.reasonSexual.value]: [
    tools.ozone.report.defs.reasonSexualUnlabeled.value,
  ],
  [com.atproto.moderation.defs.reasonRude.value]: [
    tools.ozone.report.defs.reasonHarassmentOther.value,
  ],
  [com.atproto.moderation.defs.reasonOther.value]: [
    tools.ozone.report.defs.reasonOther.value,
  ],
  [com.atproto.moderation.defs.reasonAppeal.value]: [
    tools.ozone.report.defs.reasonAppeal.value,
  ],
}

/**
 * Set of report reasons that should optionally include additional details from
 * the reporter.
 */
export const OTHER_REPORT_REASONS: Set<tools.ozone.report.defs.ReasonType> =
  new Set([
    tools.ozone.report.defs.reasonViolenceOther.value,
    tools.ozone.report.defs.reasonSexualOther.value,
    tools.ozone.report.defs.reasonChildSafetyOther.value,
    tools.ozone.report.defs.reasonHarassmentOther.value,
    tools.ozone.report.defs.reasonMisleadingOther.value,
    tools.ozone.report.defs.reasonRuleOther.value,
    tools.ozone.report.defs.reasonSelfHarmOther.value,
    tools.ozone.report.defs.reasonOther.value,
  ])

/**
 * Set of report reasons that should only be sent to Bluesky's moderation service.
 */
export const BSKY_LABELER_ONLY_REPORT_REASONS: Set<tools.ozone.report.defs.ReasonType> =
  new Set([
    tools.ozone.report.defs.reasonChildSafetyCSAM.value,
    tools.ozone.report.defs.reasonChildSafetyGroom.value,
    tools.ozone.report.defs.reasonChildSafetyOther.value,
    tools.ozone.report.defs.reasonViolenceExtremistContent.value,
  ])

/**
 * Set of _parsed_ subject types that should only be sent to Bluesky's
 * moderation service.
 */
export const BSKY_LABELER_ONLY_SUBJECT_TYPES: Set<ParsedReportSubject['type']> =
  new Set(['convoMessage', 'convo', 'status'])
