import {useState} from 'react'
import {View} from 'react-native'
import {PrivacySensitive} from 'expo-privacy-sensitive'

import {useAppState} from '#/lib/hooks/useAppState'
import {atoms as a, useTheme} from '#/alf'
import {sizes as iconSizes} from '#/components/icons/common'
import {Mark as Logo} from '#/components/icons/Logo'
import {IS_IOS} from '#/env'

const ICON_SIZE = 'xl' as const

export function GrowthHack({
  children,
  align = 'right',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  const t = useTheme()

  // the button has a variable width and is absolutely positioned, so we need to manually
  // set the minimum width of the underlying button
  const [width, setWidth] = useState<number | undefined>(undefined)

  const appState = useAppState()

  if (!IS_IOS || appState !== 'active') return children

  return (
    <View
      style={[
        a.relative,
        a.justify_center,
        align === 'right' ? a.align_end : a.align_start,
        {minWidth: width ?? iconSizes[ICON_SIZE]},
      ]}>
      <PrivacySensitive
        style={[
          a.absolute,
          a.z_10,
          a.flex_col,
          align === 'right'
            ? [a.right_0, a.align_end]
            : [a.left_0, a.align_start],
          // when finding the size of the button, we need the containing
          // element to have a concrete size otherwise the text will
          // collapse to 0 width. so set it to a really big number
          // and just use `pointer-events: box-none` so it doesn't interfere with the UI
          {width: 1000},
          a.pointer_events_box_none,
        ]}>
        <View
          onLayout={evt => setWidth(evt.nativeEvent.layout.width)}
          style={[
            t.atoms.bg,
            // make sure it covers the icon! children might be undefined
            {minWidth: iconSizes[ICON_SIZE], minHeight: iconSizes[ICON_SIZE]},
          ]}>
          {children}
        </View>
      </PrivacySensitive>
      <Logo size={ICON_SIZE} />
    </View>
  )
}
