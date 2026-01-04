import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'
import {Text} from '#/components/Typography'

export function SettingsSearchEmpty({query}: {query: string}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View style={[a.py_xl, a.px_xl, a.align_center, a.gap_sm]}>
      <SearchIcon size="lg" style={[t.atoms.text_contrast_low]} />
      <Text
        style={[a.text_md, t.atoms.text_contrast_medium, a.text_center]}
        numberOfLines={2}>
        {_(msg`No settings found for "${query}"`)}
      </Text>
    </View>
  )
}
