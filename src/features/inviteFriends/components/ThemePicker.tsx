import {useRef, useState} from 'react'
import {Modal, Pressable, StyleSheet, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {INVITE_THEME_KEYS, INVITE_THEMES, type InviteThemeKey} from '../themes'

const PILL_LABEL_SIZE = 13.1
const SWATCH_SIZE = 14
const CHEVRON_SIZE = 8

const MENU_WIDTH = 140
const MENU_ROW_HEIGHT = 44
const MENU_ITEM_SWATCH = 18
const MENU_GAP_TO_TRIGGER = 8

export function ThemePicker({
  value,
  onChange,
}: {
  value: InviteThemeKey
  onChange: (next: InviteThemeKey) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const current = INVITE_THEMES[value]
  const triggerRef = useRef<View>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  const labels: Record<InviteThemeKey, string> = {
    dawn: l`Dawn`,
    day: l`Day`,
    dusk: l`Dusk`,
    night: l`Night`,
  }

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({x, y, w, h})
      setOpen(true)
    })
  }

  const handleSelect = (key: InviteThemeKey) => {
    onChange(key)
    setOpen(false)
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={l`Pick a color theme`}
        accessibilityHint={l`Opens a list of color themes for the QR card`}
        onPress={handleOpen}
        style={({pressed}) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 12,
          paddingRight: 14,
          paddingVertical: 7,
          borderRadius: 16,
          backgroundColor: t.palette.contrast_50,
          opacity: pressed ? 0.7 : 1,
        })}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <GradientSwatch
            from={current.light.gradientFrom}
            to={current.light.gradientTo}
            size={SWATCH_SIZE}
          />
          <Text
            style={{
              color: t.palette.contrast_700,
              fontSize: PILL_LABEL_SIZE,
              fontWeight: '500',
              lineHeight: PILL_LABEL_SIZE * 1.3,
            }}>
            {l`Color`}
          </Text>
        </View>
        <ChevronDown
          width={CHEVRON_SIZE}
          height={CHEVRON_SIZE}
          fill={t.palette.contrast_700}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`Close color picker`}
          accessibilityHint={l`Dismisses the color picker`}
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}>
          {anchor ? (
            <View
              accessibilityRole="menu"
              style={{
                position: 'absolute',
                top: anchor.y + anchor.h + MENU_GAP_TO_TRIGGER,
                left: anchor.x + anchor.w / 2 - MENU_WIDTH / 2,
                width: MENU_WIDTH,
                backgroundColor: t.palette.white,
                borderRadius: 16,
                paddingVertical: 8,
                shadowColor: t.palette.black,
                shadowOpacity: 0.18,
                shadowRadius: 24,
                shadowOffset: {width: 0, height: 8},
                elevation: 8,
              }}>
              {INVITE_THEME_KEYS.map(key => {
                const theme = INVITE_THEMES[key]
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="menuitem"
                    accessibilityLabel={labels[key]}
                    accessibilityHint={l`Apply this color theme to the QR card`}
                    onPress={() => handleSelect(key)}
                    style={({pressed}) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      height: MENU_ROW_HEIGHT,
                      paddingHorizontal: 16,
                      backgroundColor: pressed
                        ? t.palette.contrast_50
                        : 'transparent',
                    })}>
                    <GradientSwatch
                      from={theme.light.gradientFrom}
                      to={theme.light.gradientTo}
                      size={MENU_ITEM_SWATCH}
                    />
                    <Text
                      style={[
                        a.text_md,
                        a.font_medium,
                        {color: t.palette.contrast_975, lineHeight: 19.5},
                      ]}>
                      {labels[key]}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  )
}

function GradientSwatch({
  from,
  to,
  size,
}: {
  from: string
  to: string
  size: number
}) {
  return (
    <LinearGradient
      colors={[from, to]}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
      style={{width: size, height: size, borderRadius: size / 2}}
    />
  )
}
