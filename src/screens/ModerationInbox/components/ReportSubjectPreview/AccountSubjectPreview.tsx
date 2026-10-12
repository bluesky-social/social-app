import {View} from 'react-native'
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
  const metadataText: string[] = []

  if (profile && moderation) {
    content = (
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <UserAvatar
          type="user"
          size={40}
          avatar={profile.avatar}
          moderation={moderation.ui('avatar')}
        />
        {handle ? (
          <Text emoji style={[a.text_md]}>
            {handle}
          </Text>
        ) : null}
      </View>
    )
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
      loading={query.isPending || (!!profile && !moderation)}
      moderation={moderation?.ui('contentView')}
      metadataText={metadataText}
      to={{screen: 'Profile', params: {name: did}}}
      openLabel={l`Open account`}>
      {content}
    </PreviewContent>
  )
}
