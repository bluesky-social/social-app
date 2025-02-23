import {ComAtprotoModerationDefs} from '@atproto/api'

import {ParsedReportSubject} from './types'

export const ALL_REPORT_REASON_TYPES = [
  'com.atproto.moderation.defs#reasonSpam',
  'com.atproto.moderation.defs#reasonViolation',
  'com.atproto.moderation.defs#reasonMisleading',
  'com.atproto.moderation.defs#reasonSexual',
  'com.atproto.moderation.defs#reasonRude',
  'com.atproto.moderation.defs#reasonHarassment',
  'com.atproto.moderation.defs#reasonAnimalAbuse',
  'com.atproto.moderation.defs#reasonGraphic',
  'com.atproto.moderation.defs#reasonScam',
  'com.atproto.moderation.defs#reasonProhibitedCommerce',
  'com.atproto.moderation.defs#reasonInauthentic',
  'com.atproto.moderation.defs#reasonImpersonation',
  'com.atproto.moderation.defs#reasonBanEvasion',
  'com.atproto.moderation.defs#reasonChildSafety',
  'com.atproto.moderation.defs#reasonSelfHarm',
  'com.atproto.moderation.defs#reasonThreat',
  'com.atproto.moderation.defs#reasonIntolerance',
  'com.atproto.moderation.defs#reasonPrivateInfo',
  'com.atproto.moderation.defs#reasonSexualAbuse',
  'com.atproto.moderation.defs#reasonSiteSecurity',
  'com.atproto.moderation.defs#reasonTerrorViolentExtremist',
  'com.atproto.moderation.defs#reasonSpoiler',
  'com.atproto.moderation.defs#reasonGrowthHack',
  'com.atproto.moderation.defs#reasonOther',
]

const REASONHARRASSMENT = 'com.atproto.moderation.defs#reasonHarassment'
const REASONINAUTHENTIC = 'com.atproto.moderation.defs#reasonInauthentic'
const REASONIMPERSONATION = 'com.atproto.moderation.defs#reasonImpersonation'
const REASONBANEVASION = 'com.atproto.moderation.defs#reasonBanEvasion'
const REASONTERRORVIOLENTEXTREMIST =
  'com.atproto.moderation.defs#reasonTerrorViolentExtremist'
const REASONANIMALABUSE = 'com.atproto.moderation.defs#reasonAnimalAbuse'
const REASONGRAPHIC = 'com.atproto.moderation.defs#reasonGraphic'
const REASONSCAM = 'com.atproto.moderation.defs#reasonScam'
const REASONPROHIBITEDCOMMERCE =
  'com.atproto.moderation.defs#reasonProhibitedCommerce'
const REASONCHILDSAFETY = 'com.atproto.moderation.defs#reasonChildSafety'
const REASONSELFHARM = 'com.atproto.moderation.defs#reasonSelfHarm'
const REASONTHREAT = 'com.atproto.moderation.defs#reasonThreat'
const REASONINTOLERANCE = 'com.atproto.moderation.defs#reasonIntolerance'
const REASONPRIVATEINFO = 'com.atproto.moderation.defs#reasonPrivateInfo'
const REASONSEXUALABUSE = 'com.atproto.moderation.defs#reasonSexualAbuse'
const REASONSITESECURITY = 'com.atproto.moderation.defs#reasonSiteSecurity'

const RECORD_REPORT_OPTIONS = [
  ComAtprotoModerationDefs.REASONSPAM,
  REASONHARRASSMENT,
  ComAtprotoModerationDefs.REASONMISLEADING,
  ComAtprotoModerationDefs.REASONSEXUAL,
  REASONANIMALABUSE,
  REASONGRAPHIC,
  REASONSCAM,
  REASONPROHIBITEDCOMMERCE,
  REASONCHILDSAFETY,
  REASONSELFHARM,
  REASONTHREAT,
  REASONINTOLERANCE,
  REASONPRIVATEINFO,
  REASONSEXUALABUSE,
  REASONSITESECURITY,
  REASONTERRORVIOLENTEXTREMIST,

  ComAtprotoModerationDefs.REASONOTHER,
]

export const REPORT_OPTIONS: Record<ParsedReportSubject['type'], string[]> = {
  account: [
    REASONHARRASSMENT,
    REASONINAUTHENTIC,
    REASONIMPERSONATION,
    REASONBANEVASION,
    REASONTERRORVIOLENTEXTREMIST,
    ComAtprotoModerationDefs.REASONSPAM,
    ComAtprotoModerationDefs.REASONMISLEADING,
    ComAtprotoModerationDefs.REASONOTHER,
  ],
  post: RECORD_REPORT_OPTIONS,
  list: RECORD_REPORT_OPTIONS,
  feed: RECORD_REPORT_OPTIONS,
  starterPack: RECORD_REPORT_OPTIONS,
  chatMessage: [
    ComAtprotoModerationDefs.REASONSPAM,
    REASONHARRASSMENT,
    ComAtprotoModerationDefs.REASONSEXUAL,
    REASONSCAM,
    REASONCHILDSAFETY,
    REASONSELFHARM,
    REASONTHREAT,
    REASONPRIVATEINFO,
    ComAtprotoModerationDefs.REASONOTHER,
  ],
}
