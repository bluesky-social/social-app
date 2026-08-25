import {SiftItem} from '@bsky.app/sift'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {type AutocompleteItemProps} from './types'

export function AutocompleteItemEmoji({
  active,
  props,
  item,
}: AutocompleteItemProps) {
  const t = useTheme()

  if (item.type !== 'emoji') return null

  return (
    <SiftItem
      {...props}
      style={s => [
        {paddingVertical: 6, paddingHorizontal: 10},
        a.flex_row,
        a.align_center,
        a.gap_sm,
        active || s.hovered || s.pressed ? [t.atoms.bg_contrast_25] : [],
      ]}>
      <Text style={[a.text_xl, a.leading_tight]}>{item.value}</Text>
      <Text style={[a.text_md, a.leading_tight]}>:{item.emoji.id}:</Text>
    </SiftItem>
  )
}
