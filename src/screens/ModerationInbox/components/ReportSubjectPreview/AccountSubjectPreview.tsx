import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import {type AccountPreview} from '../util/accountData'
import {PreviewContent} from './PreviewContent'

export function AccountSubjectPreview({
  did,
  account,
}: {
  did: string
  account?: AccountPreview
}) {
  const {i18n, t: l} = useLingui()
  const {query, profile, moderation, name, handle} =
    useSubjectPreviewProfile(did)
  let content: React.ReactNode
  let avatar: React.ReactNode
  const metadataText: string[] = []
  const snapshot = account?.profile
  const displayName =
    snapshot &&
    typeof snapshot === 'object' &&
    '$type' in snapshot &&
    snapshot.$type === app.bsky.actor.profile.$type &&
    'displayName' in snapshot &&
    typeof snapshot.displayName === 'string'
      ? snapshot.displayName
      : undefined
  const fallbackName = displayName
    ? sanitizeDisplayName(displayName)
    : undefined
  const fallbackHandle = account?.handle
    ? sanitizeHandle(account.handle, '@')
    : undefined

  if (profile && moderation) {
    avatar = (
      <UserAvatar
        type="user"
        size={40}
        avatar={profile.avatar}
        moderation={moderation.ui('avatar')}
      />
    )
    content = handle ? (
      <Text emoji style={[a.text_sm]}>
        {handle}
      </Text>
    ) : null
    if (profile.createdAt) {
      const createdAt = i18n.date(new Date(profile.createdAt), {
        dateStyle: 'medium',
      })
      metadataText.push(l`Joined ${createdAt}`)
    }
  } else {
    content = (
      <Text emoji style={[a.text_md]}>
        {fallbackHandle || (account ? did : <Trans>Account unavailable</Trans>)}
      </Text>
    )
  }

  return (
    <PreviewContent
      testID="moderationInboxAccountPreview"
      title={profile && moderation ? name : fallbackName || l`Account`}
      leading={avatar}
      loading={!account && (query.isPending || (!!profile && !moderation))}
      moderation={moderation?.ui('contentView')}
      metadataText={metadataText}
      to={
        profile && moderation
          ? {screen: 'Profile', params: {name: did}}
          : undefined
      }
      openLabel={l`Open account`}>
      {content}
    </PreviewContent>
  )
}
