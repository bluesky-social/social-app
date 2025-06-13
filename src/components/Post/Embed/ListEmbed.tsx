import React from 'react'
import {View} from 'react-native'
import {moderateUserList} from '@atproto/api'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import * as ListCard from '#/components/ListCard'
import {ContentHider} from '#/components/moderation/ContentHider'
import {EmbedType} from '#/types/bsky/post'
import {CommonProps} from './types'

export function ListEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  const t = useTheme()
  return (
    <View
      style={[a.border, t.atoms.border_contrast_medium, a.p_md, a.rounded_sm]}>
      <ListCard.Default view={embed.view} />
    </View>
  )
}

export function ModeratedListEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  const moderationOpts = useModerationOpts()
  const moderation = React.useMemo(() => {
    return moderationOpts
      ? moderateUserList(embed.view, moderationOpts)
      : undefined
  }, [embed.view, moderationOpts])
  return (
    <ContentHider modui={moderation?.ui('contentList')}>
      <ListEmbed embed={embed} />
    </ContentHider>
  )
}
