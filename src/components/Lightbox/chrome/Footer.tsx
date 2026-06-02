import {useRef} from 'react'
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
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
            scrollEnabled={isAltExpanded}
            onMomentumScrollBegin={() => {
              isMomentumScrolling.current = true
            }}
            onMomentumScrollEnd={() => {
              isMomentumScrolling.current = false
            }}
            contentContainerStyle={[a.px_md, a.py_sm]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={l`Expand alt text`}
              accessibilityHint=""
              onPress={() => {
                if (isMomentumScrolling.current) return
                LayoutAnimation.configureNext({
                  duration: 450,
                  update: {type: 'spring', springDamping: 1},
                })
                onToggleAltExpanded()
              }}>
              <Text
                emoji
                selectable
                style={[a.text_sm, {color: t.palette.white}]}
                numberOfLines={isAltExpanded ? undefined : 3}>
                {altText}
              </Text>
            </Pressable>
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
