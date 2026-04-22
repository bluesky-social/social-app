import {View} from 'react-native'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Celebrate_Stroke2_Corner0_Rounded as Celebrate} from '#/components/icons/Celebrate'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {Shaka_Stroke2_Corner0_Rounded as Shaka} from '#/components/icons/Shaka'
import {Trending3_Stroke2_Corner1_Rounded as Trending} from '#/components/icons/Trending'

export type GifCategory = {
  id: string
  icon: React.ComponentType<SVGIconProps>
  label: MessageDescriptor
  searchterm: string | null // null = trending/recents (handled by consumer)
}

export const GIF_CATEGORIES: readonly GifCategory[] = [
  {id: 'recents', icon: Clock, label: msg`Recents`, searchterm: null},
  {id: 'trending', icon: Trending, label: msg`Trending`, searchterm: null},
  {id: 'love', icon: Heart, label: msg`Love`, searchterm: 'love'},
  {id: 'happy', icon: EmojiSmile, label: msg`Happy`, searchterm: 'happy'},
  {id: 'sad', icon: EmojiSad, label: msg`Sad`, searchterm: 'cry'},
  {
    id: 'party',
    icon: Celebrate,
    label: msg`Party`,
    searchterm: 'congratulations',
  },
  {id: 'yes', icon: Shaka, label: msg`Yes`, searchterm: 'yes'},
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
  const {i18n} = useLingui()
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_row,
        a.justify_between,
        a.align_center,
        a.gap_xs,
        a.pb_md,
        t.atoms.bg,
      ]}>
      {GIF_CATEGORIES.map(category => {
        if (category.id === 'recents' && !hasRecents) return null
        const isActive = category.id === activeId
        return (
          <Button
            key={category.id}
            label={i18n._(category.label)}
            aria-current={isActive ? 'true' : undefined}
            onPress={() => onSelect(category)}
            size="small"
            color={isActive ? 'secondary_inverted' : 'secondary'}
            shape="round">
            <ButtonIcon icon={category.icon} size="md" />
          </Button>
        )
      })}
    </View>
  )
}
