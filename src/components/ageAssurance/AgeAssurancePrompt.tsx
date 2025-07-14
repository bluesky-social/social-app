import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgeAssuranceContext} from '#/state/age-assurance'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, select, useTheme, type ViewStyleProp} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {
  AgeAssuranceInitDialog,
  useDialogControl,
} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {IsAgeRestricted} from '#/components/ageAssurance/IsAgeRestricted'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import type * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

export function AgeAssurancePrompt({style}: ViewStyleProp & {}) {
  const control = useDialogControl()
  const {hasInitiated} = useAgeAssuranceContext()
  const {nux} = useNux(Nux.AgeAssurancePrompt)

  if (nux && nux.completed) return null

  return (
    <>
      <IsAgeRestricted.True>
        {!hasInitiated && <Inner style={style} control={control} />}
        <AgeAssuranceInitDialog control={control} />
      </IsAgeRestricted.True>
    </>
  )
}

function Inner({
  style,
  control,
}: ViewStyleProp & {control: Dialog.DialogControlProps}) {
  const t = useTheme()
  const {_} = useLingui()
  const {mutate: save} = useSaveNux()

  return (
    <>
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
              The laws in your location require that you verify your age before
              accessing certain features on Bluesky like adult content and
              direct messaging.
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
              style={[
                a.leading_snug,
                a.flex_1,
                {
                  color: select(t.name, {
                    light: t.palette.primary_800,
                    dark: t.palette.primary_800,
                    dim: t.palette.primary_800,
                  }),
                },
              ]}>
              <Trans>Age verification takes only a few minutes</Trans>
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

          <Button
            label={_(msg`Don't show again`)}
            size="tiny"
            variant="solid"
            color="secondary_inverted"
            shape="round"
            onPress={() =>
              save({
                id: Nux.AgeAssurancePrompt,
                completed: true,
                data: undefined,
              })
            }
            style={[
              a.absolute,
              {
                top: 12,
                right: 12,
              },
            ]}>
            <ButtonIcon icon={X} />
          </Button>
        </View>
      </View>
    </>
  )
}
