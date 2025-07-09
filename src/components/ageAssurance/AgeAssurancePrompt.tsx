import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgeAssuranceContext} from '#/state/age-assurance'
import {atoms as a, select, useTheme, type ViewStyleProp} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {
  AgeAssuranceInitDialog,
  useDialogControl,
} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {IsAgeRestricted} from '#/components/ageAssurance/IsAgeRestricted'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {Text} from '#/components/Typography'

export function AgeAssurancePrompt({style}: ViewStyleProp & {}) {
  return (
    <IsAgeRestricted.True>
      <Inner style={style} />
    </IsAgeRestricted.True>
  )
}

function Inner({style}: ViewStyleProp & {}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasInitiated} = useAgeAssuranceContext()
  const control = useDialogControl()

  return hasInitiated ? null : (
    <>
      <AgeAssuranceInitDialog control={control} />

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
            <AgeAssuranceBadge />
          </View>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              You're using Bluesky from a location that legally requires you to
              verify your age prior to accessing certain content and features.
            </Trans>
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
              color="primary"
              onPress={() => control.open()}>
              <ButtonText>
                <Trans>Verify now</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
      </View>
    </>
  )
}
