var _a, _b;
import { ComAtprotoModerationDefs as RootReportDefs, ToolsOzoneReportDefs as OzoneReportDefs, } from '@atproto/api';
export var DMCA_LINK = 'https://bsky.social/about/support/copyright';
export var SUPPORT_PAGE = 'https://bsky.social/about/support';
export var NEW_TO_OLD_REASON_MAPPING = {};
/**
 * Mapping of new (Ozone namespace) reason types to old reason types.
 *
 * Matches the mapping defined in the Ozone codebase:
 * @see https://github.com/bluesky-social/atproto/blob/4c15fb47cec26060bff2e710e95869a90c9d7fdd/packages/ozone/src/mod-service/profile.ts#L16-L64
 */
export var NEW_TO_OLD_REASONS_MAP = (_a = {},
    _a[OzoneReportDefs.REASONAPPEAL] = RootReportDefs.REASONAPPEAL,
    _a[OzoneReportDefs.REASONOTHER] = RootReportDefs.REASONOTHER,
    _a[OzoneReportDefs.REASONVIOLENCEANIMAL] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONVIOLENCETHREATS] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONVIOLENCEGRAPHICCONTENT] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONVIOLENCEGLORIFICATION] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONVIOLENCETRAFFICKING] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONVIOLENCEOTHER] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONSEXUALABUSECONTENT] = RootReportDefs.REASONSEXUAL,
    _a[OzoneReportDefs.REASONSEXUALNCII] = RootReportDefs.REASONSEXUAL,
    _a[OzoneReportDefs.REASONSEXUALDEEPFAKE] = RootReportDefs.REASONSEXUAL,
    _a[OzoneReportDefs.REASONSEXUALANIMAL] = RootReportDefs.REASONSEXUAL,
    _a[OzoneReportDefs.REASONSEXUALUNLABELED] = RootReportDefs.REASONSEXUAL,
    _a[OzoneReportDefs.REASONSEXUALOTHER] = RootReportDefs.REASONSEXUAL,
    _a[OzoneReportDefs.REASONCHILDSAFETYCSAM] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONCHILDSAFETYGROOM] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONCHILDSAFETYPRIVACY] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONCHILDSAFETYHARASSMENT] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONCHILDSAFETYOTHER] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONHARASSMENTTROLL] = RootReportDefs.REASONRUDE,
    _a[OzoneReportDefs.REASONHARASSMENTTARGETED] = RootReportDefs.REASONRUDE,
    _a[OzoneReportDefs.REASONHARASSMENTHATESPEECH] = RootReportDefs.REASONRUDE,
    _a[OzoneReportDefs.REASONHARASSMENTDOXXING] = RootReportDefs.REASONRUDE,
    _a[OzoneReportDefs.REASONHARASSMENTOTHER] = RootReportDefs.REASONRUDE,
    _a[OzoneReportDefs.REASONMISLEADINGBOT] = RootReportDefs.REASONMISLEADING,
    _a[OzoneReportDefs.REASONMISLEADINGIMPERSONATION] = RootReportDefs.REASONMISLEADING,
    _a[OzoneReportDefs.REASONMISLEADINGSPAM] = RootReportDefs.REASONSPAM,
    _a[OzoneReportDefs.REASONMISLEADINGSCAM] = RootReportDefs.REASONMISLEADING,
    _a[OzoneReportDefs.REASONMISLEADINGELECTIONS] = RootReportDefs.REASONMISLEADING,
    _a[OzoneReportDefs.REASONMISLEADINGOTHER] = RootReportDefs.REASONMISLEADING,
    _a[OzoneReportDefs.REASONRULESITESECURITY] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONRULEPROHIBITEDSALES] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONRULEBANEVASION] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONRULEOTHER] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONSELFHARMCONTENT] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONSELFHARMED] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONSELFHARMSTUNTS] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONSELFHARMSUBSTANCES] = RootReportDefs.REASONVIOLATION,
    _a[OzoneReportDefs.REASONSELFHARMOTHER] = RootReportDefs.REASONVIOLATION,
    _a);
/**
 * Mapping of old reason types to new (Ozone namespace) reason types.
 * @see https://github.com/bluesky-social/proposals/tree/main/0009-mod-report-granularity#backwards-compatibility
 */
export var OLD_TO_NEW_REASONS_MAP = (_b = {},
    _b[RootReportDefs.REASONSPAM] = [OzoneReportDefs.REASONMISLEADINGSPAM],
    _b[RootReportDefs.REASONVIOLATION] = [OzoneReportDefs.REASONRULEOTHER],
    _b[RootReportDefs.REASONMISLEADING] = [OzoneReportDefs.REASONMISLEADINGOTHER],
    _b[RootReportDefs.REASONSEXUAL] = [OzoneReportDefs.REASONSEXUALUNLABELED],
    _b[RootReportDefs.REASONRUDE] = [OzoneReportDefs.REASONHARASSMENTOTHER],
    _b[RootReportDefs.REASONOTHER] = [OzoneReportDefs.REASONOTHER],
    _b[RootReportDefs.REASONAPPEAL] = [OzoneReportDefs.REASONAPPEAL],
    _b);
/**
 * Set of report reasons that should optionally include additional details from
 * the reporter.
 */
export var OTHER_REPORT_REASONS = new Set([
    OzoneReportDefs.REASONVIOLENCEOTHER,
    OzoneReportDefs.REASONSEXUALOTHER,
    OzoneReportDefs.REASONCHILDSAFETYOTHER,
    OzoneReportDefs.REASONHARASSMENTOTHER,
    OzoneReportDefs.REASONMISLEADINGOTHER,
    OzoneReportDefs.REASONRULEOTHER,
    OzoneReportDefs.REASONSELFHARMOTHER,
    OzoneReportDefs.REASONOTHER,
]);
/**
 * Set of report reasons that should only be sent to Bluesky's moderation service.
 */
export var BSKY_LABELER_ONLY_REPORT_REASONS = new Set([
    OzoneReportDefs.REASONCHILDSAFETYCSAM,
    OzoneReportDefs.REASONCHILDSAFETYGROOM,
    OzoneReportDefs.REASONCHILDSAFETYOTHER,
    OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT,
]);
/**
 * Set of _parsed_ subject types that should only be sent to Bluesky's
 * moderation service.
 */
export var BSKY_LABELER_ONLY_SUBJECT_TYPES = new Set(['convoMessage', 'status']);
