import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as ListCard from '#/components/ListCard'
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
