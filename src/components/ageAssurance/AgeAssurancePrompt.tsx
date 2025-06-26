import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {atoms as a, select, useTheme, type ViewStyleProp} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {Shield_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'
import {Text} from '#/components/Typography'

export function AgeAssurancePrompt({style}: ViewStyleProp & {}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasInitiated} = useAgeAssuranceContext()

  return hasInitiated ? null : (
    <View style={style}>
      <View
        style={[
          a.p_lg,
          a.rounded_md,
          a.border,
          {
            backgroundColor: select(t.name, {
              light: t.palette.primary_25,
              dark: t.palette.primary_25,
              dim: t.palette.primary_25,
            }),
            borderColor: select(t.name, {
              light: t.palette.primary_100,
              dark: t.palette.primary_100,
              dim: t.palette.primary_100,
            }),
          },
        ]}>
        <View style={[a.align_start, a.pb_md]}>
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_xs,
              a.px_sm,
              a.py_xs,
              a.pr_sm,
              a.rounded_full,
              {
                backgroundColor: select(t.name, {
                  light: t.palette.primary_100,
                  dark: t.palette.primary_100,
                  dim: t.palette.primary_100,
                }),
              },
            ]}>
            <Shield size="sm" />
            <Text
              style={[
                a.font_bold,
                a.leading_snug,
                {
                  color: select(t.name, {
                    light: t.palette.primary_800,
                    dark: t.palette.primary_800,
                    dim: t.palette.primary_800,
                  }),
                },
              ]}>
              <Trans>Age Assurance</Trans>
            </Text>
          </View>
        </View>
        <Text style={[a.text_md, a.leading_snug]}>
          You're currently accessing Bluesky from a location that by law
          requires you to verify your age prior to accessing certain content and
          features.
        </Text>

        <Divider
          style={[
            a.mt_lg,
            {
              borderColor: select(t.name, {
                light: t.palette.primary_100,
                dark: t.palette.primary_100,
                dim: t.palette.primary_100,
              }),
            },
          ]}
        />

        <View
          style={[
            a.flex_row,
            a.justify_between,
            a.align_center,
            a.pt_md,
            a.gap_lg,
          ]}>
          <Text
            style={{
              color: select(t.name, {
                light: t.palette.primary_800,
                dark: t.palette.primary_800,
                dim: t.palette.primary_800,
              }),
            }}>
            <Trans>Verification takes only a few minutes</Trans>
          </Text>

          <Button
            label={_(msg`Verify now`)}
            size="small"
            variant="solid"
            color="primary">
            <ButtonText>
              <Trans>Verify now</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </View>
  )
}
