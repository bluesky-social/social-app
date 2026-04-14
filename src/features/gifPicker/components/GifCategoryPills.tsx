import {ScrollView, View} from 'react-native'
import {i18n, type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

export type GifCategory = {
  id: string
  emoji: string
  label: MessageDescriptor
  searchterm: string | null // null = trending/recents (handled by consumer)
}

export const GIF_CATEGORIES: readonly GifCategory[] = [
  {id: 'recents', emoji: '🕐', label: msg`Recents`, searchterm: null},
  {id: 'trending', emoji: '🔥', label: msg`Trending`, searchterm: null},
  {id: 'love', emoji: '❤️', label: msg`Love`, searchterm: 'love'},
  {id: 'happy', emoji: '😄', label: msg`Happy`, searchterm: 'happy'},
  {id: 'sad', emoji: '😢', label: msg`Sad`, searchterm: 'cry'},
  {id: 'party', emoji: '🎉', label: msg`Party`, searchterm: 'congratulations'},
  {id: 'yes', emoji: '👍', label: msg`Yes`, searchterm: 'yes'},
  {id: 'lol', emoji: '😂', label: msg`LOL`, searchterm: 'lol'},
  {id: 'excited', emoji: '🤩', label: msg`Excited`, searchterm: 'excited'},
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
    <View style={[a.mb_sm]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[a.flex_row, a.gap_xs, a.px_xl]}>
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
              <ButtonText emoji>{category.emoji}</ButtonText>
            </Button>
          )
        })}
      </ScrollView>
    </View>
  )
}
