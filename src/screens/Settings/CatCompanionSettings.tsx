import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useCatCompanion,
  useSetCatCompanion,
} from '#/state/preferences/cat-companion'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {CAT_COLORS, type CatColor} from '#/features/catCompanion/catalog'
import {CatSprite} from '#/features/catCompanion/CatSprite'

const SWATCH_SIZE = 64

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'CatCompanionSettings'
>
export function CatCompanionSettingsScreen({}: Props) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {enabled, color} = useCatCompanion()
  const setCatCompanion = useSetCatCompanion()

  const colorLabels: Record<CatColor, string> = {
    cream: l`Cream`,
    black: l`Black`,
    grey: l`Grey`,
    'grey-white': l`Grey and white`,
    orange: l`Orange`,
    white: l`White`,
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Companion cat</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={HeartIcon} />
            <SettingsList.ItemText>
              <Trans>Companion cat</Trans>
            </SettingsList.ItemText>
            <Text
              style={[
                a.text_sm,
                a.leading_snug,
                t.atoms.text_contrast_medium,
                a.w_full,
              ]}>
              <Trans>
                A little cat hangs out at the bottom of the screen. Tap it to
                pet it – scratch its head or tickle its belly.
              </Trans>
            </Text>
            <Toggle.Item
              name="cat_companion_enabled"
              label={l`Show the companion cat`}
              value={enabled}
              onChange={value => setCatCompanion({enabled: value})}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Show the companion cat</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          {enabled && (
            <>
              <SettingsList.Divider />
              <View style={[a.px_xl, a.py_md, a.gap_md]}>
                <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                  <Trans>Color</Trans>
                </Text>
                <View style={[a.flex_row, a.flex_wrap, a.gap_md]}>
                  {CAT_COLORS.map(c => {
                    const selected = c === color
                    return (
                      <Pressable
                        key={c}
                        accessibilityRole="button"
                        accessibilityState={{selected}}
                        accessibilityLabel={colorLabels[c]}
                        accessibilityHint={l`Selects this coat color`}
                        onPress={() => setCatCompanion({color: c})}
                        style={[a.align_center, a.gap_xs]}>
                        <View
                          style={[
                            a.align_center,
                            a.justify_end,
                            a.rounded_md,
                            a.border,
                            {
                              width: SWATCH_SIZE + 12,
                              height: SWATCH_SIZE + 12,
                              paddingBottom: 2,
                            },
                            selected
                              ? {
                                  borderColor: t.palette.primary_500,
                                  borderWidth: 2,
                                  backgroundColor: t.palette.primary_25,
                                }
                              : [
                                  t.atoms.border_contrast_low,
                                  t.atoms.bg_contrast_25,
                                ],
                          ]}>
                          <CatSprite
                            color={c}
                            state="Idle"
                            size={SWATCH_SIZE}
                          />
                        </View>
                        <Text
                          style={[
                            a.text_xs,
                            selected
                              ? {color: t.palette.primary_500}
                              : t.atoms.text_contrast_medium,
                          ]}>
                          {colorLabels[c]}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
