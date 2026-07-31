import {View} from 'react-native'
import {SiftItem} from '@bsky.app/sift'

import {atoms as a, useTheme} from '#/alf'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass'
import {Text} from '#/components/Typography'
import {type AutocompleteItemProps} from './types'

export function AutocompleteItemSearch({
  active,
  isFirst,
  isLast,
  props,
  item,
}: AutocompleteItemProps) {
  const t = useTheme()

  if (item.type !== 'search') return null

  return (
    <SiftItem
      {...props}
      style={s => [
        a.py_sm,
        a.px_md,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        active || s.hovered || s.pressed ? [t.atoms.bg_contrast_25] : [],
        isFirst && {
          paddingTop: a.py_sm.paddingTop * 1.2,
        },
        isLast && {
          paddingBottom: a.py_sm.paddingTop * 1.2,
        },
      ]}>
      <View
        style={[
          a.align_center,
          {
            width: 40,
          },
        ]}>
        <MagnifyingGlassIcon fill={t.atoms.text_contrast_low.color} size="xl" />
      </View>
      <Text style={[a.text_md, a.leading_snug]}>{item.value}</Text>
    </SiftItem>
  )
}
