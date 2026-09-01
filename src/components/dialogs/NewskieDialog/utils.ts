import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {dateDiff, formatDateDiff} from '#/lib/hooks/useTimeAgo'

export function getJoinMessage({
  i18n,
  profileName,
  isMe,
  joinedViaStarterPack,
  createdAt,
  now,
}: {
  i18n: I18n
  profileName: string
  isMe: boolean
  joinedViaStarterPack: boolean
  createdAt: string
  now: number
}): string {
  const diff = dateDiff(createdAt, now)

  if (diff.unit === 'now') {
    if (isMe) {
      return joinedViaStarterPack
        ? i18n._(msg`You joined Bluesky using a starter pack just now`)
        : i18n._(msg`You joined Bluesky just now`)
    }

    return joinedViaStarterPack
      ? i18n._(msg`${profileName} joined Bluesky using a starter pack just now`)
      : i18n._(msg`${profileName} joined Bluesky just now`)
  }

  const timeAgoString = formatDateDiff({diff, i18n, format: 'long'})

  if (isMe) {
    return joinedViaStarterPack
      ? i18n._(
          msg`You joined Bluesky using a starter pack ${timeAgoString} ago`,
        )
      : i18n._(msg`You joined Bluesky ${timeAgoString} ago`)
  }

  return joinedViaStarterPack
    ? i18n._(
        msg`${profileName} joined Bluesky using a starter pack ${timeAgoString} ago`,
      )
    : i18n._(msg`${profileName} joined Bluesky ${timeAgoString} ago`)
}
