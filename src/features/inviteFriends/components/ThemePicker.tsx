import {Pressable, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {useLingui} from '@lingui/react/macro'

import {useTheme} from '#/alf'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {INVITE_THEME_KEYS, INVITE_THEMES, type InviteThemeKey} from '../themes'

const PILL_LABEL_SIZE = 13.1
const SWATCH_SIZE = 14
const CHEVRON_SIZE = 8
const MENU_ITEM_SWATCH = 18

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

  const labels: Record<InviteThemeKey, string> = {
    dawn: l`Dawn`,
    sunlight: l`Sunlight`,
    day: l`Day`,
    dusk: l`Dusk`,
    twilight: l`Twilight`,
    night: l`Night`,
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        label={l`Pick a color theme`}
        hint={l`Opens a list of color themes for the QR card`}>
        {({props}) => (
          <Pressable
            {...props}
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
        )}
      </Menu.Trigger>

      <Menu.Outer>
        <Menu.Group>
          {INVITE_THEME_KEYS.map(key => {
            const theme = INVITE_THEMES[key]
            return (
              <Menu.Item
                key={key}
                label={labels[key]}
                onPress={() => onChange(key)}>
                <GradientSwatch
                  from={theme.light.gradientFrom}
                  to={theme.light.gradientTo}
                  size={MENU_ITEM_SWATCH}
                />
                <Menu.ItemText>{labels[key]}</Menu.ItemText>
                <Menu.ItemRadio selected={key === value} />
              </Menu.Item>
            )
          })}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
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
