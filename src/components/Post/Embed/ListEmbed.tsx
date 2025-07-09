import {useMemo} from 'react'
import {moderateUserList} from '@atproto/api'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import * as ListCard from '#/components/ListCard'
import {ContentHider} from '#/components/moderation/ContentHider'
import {type EmbedType} from '#/types/bsky/post'
import {type CommonProps} from './types'

export function ListEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  const t = useTheme()
  return (
    <ListCard.Default
      view={embed.view}
      style={[a.border, t.atoms.border_contrast_medium, a.p_md, a.rounded_sm]}
    />
  )
}

export function ModeratedListEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  const moderationOpts = useModerationOpts()
  const moderation = useMemo(() => {
    return moderationOpts
      ? moderateUserList(embed.view, moderationOpts)
      : undefined
  }, [embed.view, moderationOpts])
  return (
    <ContentHider
      modui={moderation?.ui('contentList')}
      childContainerStyle={[a.pt_xs]}>
      <ListEmbed embed={embed} />
    </ContentHider>
  )
}
