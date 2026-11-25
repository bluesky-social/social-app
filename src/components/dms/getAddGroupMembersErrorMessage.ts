import {msg} from '@lingui/core/macro'

import {matchXrpcError} from '#/lib/xrpc-error'
import {chat} from '#/lexicons'

/** Explains server rejections even when cached profiles allow selection. */
export function getAddGroupMembersErrorMessage(error: unknown) {
  switch (matchXrpcError(error, chat.bsky.group.addMembers)) {
    case 'BlockedSubject':
      return msg`Members could not be added because you have blocked one of the selected accounts.`
    case 'BlockedActor':
      return msg`Members could not be added because one of the selected accounts has blocked you.`
    default:
      return msg`Failed to add members`
  }
}
