import {View} from 'react-native'
import {i18n, type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Celebrate_Stroke2_Corner0_Rounded as Celebrate} from '#/components/icons/Celebrate'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  EmojiArc_Stroke2_Corner0_Rounded as EmojiArc,
  EmojiHeartEyes_Stroke2_Corner0_Rounded as EmojiHeartEyes,
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji'
import {Flame_Stroke2_Corner1_Rounded as Flame} from '#/components/icons/Flame'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled} from '#/components/icons/Heart2'

export type GifCategory = {
  id: string
  icon: React.ComponentType<SVGIconProps>
  label: MessageDescriptor
  searchterm: string | null // null = trending/recents (handled by consumer)
}

export const GIF_CATEGORIES: readonly GifCategory[] = [
  {id: 'recents', icon: Clock, label: msg`Recents`, searchterm: null},
  {id: 'trending', icon: Flame, label: msg`Trending`, searchterm: null},
  {id: 'love', icon: HeartFilled, label: msg`Love`, searchterm: 'love'},
  {id: 'happy', icon: EmojiSmile, label: msg`Happy`, searchterm: 'happy'},
  {id: 'sad', icon: EmojiSad, label: msg`Sad`, searchterm: 'cry'},
  {id: 'party', icon: Celebrate, label: msg`Party`, searchterm: 'congratulations'},
  {id: 'yes', icon: Check, label: msg`Yes`, searchterm: 'yes'},
  {id: 'lol', icon: EmojiArc, label: msg`LOL`, searchterm: 'lol'},
  {id: 'excited', icon: EmojiHeartEyes, label: msg`Excited`, searchterm: 'excited'},
] as const

export function GifCategoryPills({
  activeId,
  onSelect,
  hasRecents,
}: {
  activeId: string
  onSelect: (category: GifCategory) => void
  hasRecents: boolean
}) {
  // useLingui() is called to re-render when the locale changes, even though we
  // translate via i18n._() below to satisfy the lingui-msg-rule lint constraint.
  useLingui()

  return (
    <View
      style={[
        a.flex_row,
        a.justify_between,
        a.align_center,
        a.gap_xs,
        a.px_xl,
        a.mb_sm,
      ]}>
      {GIF_CATEGORIES.map(category => {
        if (category.id === 'recents' && !hasRecents) return null
        const isActive = category.id === activeId
        const label = i18n._(category.label)
        return (
          <Button
            key={category.id}
            label={label}
            onPress={() => onSelect(category)}
            size="small"
            variant={isActive ? 'solid' : 'outline'}
            color={isActive ? 'primary' : 'secondary'}
            shape="round">
            <ButtonIcon icon={category.icon} />
          </Button>
        )
      })}
    </View>
  )
}
