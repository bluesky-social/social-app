import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useAgeAssuranceContext} from '#/state/age-assurance'
import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {
  AgeAssuranceInitDialog,
  useDialogControl,
} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {IsAgeRestricted} from '#/components/ageAssurance/IsAgeRestricted'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function AgeAssuranceAccountCard({style}: ViewStyleProp & {}) {
  return (
    <IsAgeRestricted.True>
      <Inner style={style} />
    </IsAgeRestricted.True>
  )
}

function Inner({style}: ViewStyleProp & {}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const {isAgeRestricted, hasInitiated, lastInitiatedAt} =
    useAgeAssuranceContext()
  const control = useDialogControl()
  const getTimeAgo = useGetTimeAgo()
  const timeAgo = lastInitiatedAt
    ? getTimeAgo(lastInitiatedAt, new Date())
    : null

  if (!isAgeRestricted) return null

  return (
    <>
      <AgeAssuranceInitDialog control={control} />

      <View style={style}>
        <View
          style={[a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low]}>
          <View
            style={[
              a.flex_row,
              a.justify_between,
              a.align_center,
              a.gap_lg,
              a.pb_md,
              a.z_10,
            ]}>
            <View style={[a.align_start]}>
              <AgeAssuranceBadge />
            </View>

            {lastInitiatedAt && (
              <Text
                style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}
                title={i18n.date(lastInitiatedAt, {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}>
                {timeAgo === 'now' ? (
                  <Trans>Last initiated just {timeAgo}</Trans>
                ) : (
                  <Trans>Last initiated {timeAgo} ago</Trans>
                )}
              </Text>
            )}
          </View>

          <View
            style={[a.flex_row, a.justify_between, a.align_start, a.gap_xl]}>
            <Text style={[a.text_sm, a.leading_snug]}>
              <Trans>
                You're accessing Bluesky from a region that requires you to
                verify your age prior to accessing certain content and features.
              </Trans>
            </Text>

            <Button
              label={_(msg`Verify now`)}
              size="small"
              variant="solid"
              color={hasInitiated ? 'secondary' : 'primary'}
              onPress={() => control.open()}>
              <ButtonText>
                {hasInitiated ? (
                  <Trans>Verify again</Trans>
                ) : (
                  <Trans>Verify now</Trans>
                )}
              </ButtonText>
            </Button>
          </View>
        </View>
      </View>
    </>
  )
}
