import {Trans, useLingui} from '@lingui/react/macro'

import {UserAvatar} from '#/view/com/util/UserAvatar'
import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {PreviewContent} from './PreviewContent'

export function AccountSubjectPreview({did}: {did: string}) {
  const {i18n, t: l} = useLingui()
  const {query, profile, moderation, name, handle} =
    useSubjectPreviewProfile(did)
  let content: React.ReactNode
  let avatar: React.ReactNode
  const metadataText: string[] = []

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
      <Text style={[a.text_md]}>
        <Trans>Account unavailable</Trans>
      </Text>
    )
  }

  return (
    <PreviewContent
      testID="moderationInboxAccountPreview"
      title={name}
      leading={avatar}
      loading={query.isPending || (!!profile && !moderation)}
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
