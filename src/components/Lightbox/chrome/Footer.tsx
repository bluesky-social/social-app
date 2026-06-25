import {useRef} from 'react'
import {LayoutAnimation, ScrollView, StyleSheet, View} from 'react-native'
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {BlurView} from 'expo-blur'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, platform, useTheme} from '#/alf'
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
  const {height: screenHeight} = useSafeAreaFrame()
  const isMomentumScrolling = useRef(false)

  if (!altText) return null

  // Cap the overlay height so long alt text - or text enlarged by the OS via
  // Dynamic Type / font scaling - scrolls within the overlay instead of growing
  // past the top of the screen. Leaves the upper half clear for the header.
  const maxHeight = screenHeight / 2

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
        <BlurView
          intensity={16}
          tint="dark"
          style={[
            // Tint kept over the blur so dense, text-heavy images stay
            // readable. On Android the blur falls back to a flat overlay, so
            // bump the opacity to keep the contrast the real blur provides
            // elsewhere.
            platform({
              ios: {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
              android: {backgroundColor: 'rgba(0, 0, 0, 0.7)'},
            }),
          ]}>
          <ScrollView
            style={{maxHeight}}
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
        </BlurView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  altWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
})
