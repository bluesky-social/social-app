import {AtUri, isAtUriString, isValidDid} from '@atproto/syntax'

import {type CommonNavigationDestination} from '#/lib/routes/types'

export type ModerationPushPayload = {
  reason: 'moderation-inbox'
  version: '1'
  recipientDid: string
  serviceDid: string
} & (
  | {section: 'reports'; reportId: string}
  | {section: 'subjects'; subject: string}
  | {section: 'accountStatus'}
)

export function parseModerationPush(
  value: unknown,
): ModerationPushPayload | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Record<string, unknown>
  if (
    data.reason !== 'moderation-inbox' ||
    data.version !== '1' ||
    typeof data.recipientDid !== 'string' ||
    !isValidDid(data.recipientDid) ||
    typeof data.serviceDid !== 'string' ||
    !isValidDid(data.serviceDid)
  )
    return null
  const base = {
    reason: 'moderation-inbox' as const,
    version: '1' as const,
    recipientDid: data.recipientDid,
    serviceDid: data.serviceDid,
  }
  if (
    data.section === 'reports' &&
    typeof data.reportId === 'string' &&
    /^[1-9]\d{0,9}$/.test(data.reportId)
  ) {
    return {...base, section: 'reports', reportId: data.reportId}
  }
  if (data.section === 'subjects' && typeof data.subject === 'string') {
    if (isValidDid(data.subject) && data.subject === data.recipientDid) {
      return {...base, section: 'subjects', subject: data.subject}
    }
    if (isAtUriString(data.subject, {strict: false})) {
      const uri = new AtUri(data.subject)
      if (uri.host === data.recipientDid && uri.collection && uri.rkey) {
        return {...base, section: 'subjects', subject: data.subject}
      }
    }
  }
  if (data.section === 'accountStatus')
    return {...base, section: 'accountStatus'}
  return null
}

export function moderationPushDestination(
  payload: ModerationPushPayload,
): CommonNavigationDestination {
  switch (payload.section) {
    case 'reports':
      return {
        name: 'ModerationInboxReportDetails',
        params: {moderationService: payload.serviceDid, id: payload.reportId},
      }
    case 'subjects':
      return {
        name: 'ModerationInboxNoticeDetails',
        params: {
          moderationService: payload.serviceDid,
          subject: payload.subject,
        },
      }
    case 'accountStatus':
      return {name: 'ModerationInbox', params: {tab: 'account'}}
  }
}
