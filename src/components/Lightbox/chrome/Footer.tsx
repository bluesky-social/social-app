import {useRef} from 'react'
import {LayoutAnimation, ScrollView, StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

type Props = {
  altText: string | undefined
  isAltExpanded: boolean
  onToggleAltExpanded: () => void
}

export function Footer({altText, isAltExpanded, onToggleAltExpanded}: Props) {
  const {t: l} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const isMomentumScrolling = useRef(false)

  if (!altText) return null

  return (
    <View
      style={[
        a.absolute,
        a.left_0,
        a.right_0,
        a.bottom_0,
        a.pointer_events_box_none,
        {paddingBottom: insets.bottom + 8},
      ]}>
      <View style={[a.mx_md, styles.altWrap]}>
        <ScrollView
          scrollEnabled={isAltExpanded}
          onMomentumScrollBegin={() => {
            isMomentumScrolling.current = true
          }}
          onMomentumScrollEnd={() => {
            isMomentumScrolling.current = false
          }}
          contentContainerStyle={[a.px_md, a.py_sm]}>
          <View
            accessibilityRole="button"
            accessibilityLabel={l`Expand alt text`}
            accessibilityHint="">
            {/*
             * The press handlers must live on the Text itself, not on a
             * wrapping Pressable. Text selection is driven by the platform's
             * native text view long-press (RN Text on Android, UITextView on
             * iOS). A parent touchable consumes that long-press before the
             * selectable Text can begin a selection - on Android this prevents
             * selection entirely. Keeping onPress/onLongPress on the Text lets
             * the same native node own both the tap-to-expand and the
             * long-press-to-select. The empty onLongPress is intentional: it
             * reserves the long-press for the OS selection gesture instead of
             * firing the expand toggle. RN exposes no API to arbitrate tap vs
             * native selection on a single node, so this is the supported
             * workaround, and it behaves consistently on both platforms.
             */}
            <Text
              emoji
              selectable
              style={[a.text_sm, {color: t.palette.white}]}
              numberOfLines={isAltExpanded ? undefined : 3}
              onPress={() => {
                if (isMomentumScrolling.current) return
                LayoutAnimation.configureNext({
                  duration: 450,
                  update: {type: 'spring', springDamping: 1},
                })
                onToggleAltExpanded()
              }}
              onLongPress={() => {}}>
              {altText}
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  altWrap: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    overflow: 'hidden',
  },
})
