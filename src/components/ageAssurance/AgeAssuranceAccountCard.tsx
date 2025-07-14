import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useAgeAssuranceContext} from '#/state/age-assurance'
import {atoms as a, useBreakpoints, useTheme, type ViewStyleProp} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceAppealDialog} from '#/components/ageAssurance/AgeAssuranceAppealDialog'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {
  AgeAssuranceInitDialog,
  useDialogControl,
} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {IsAgeRestricted} from '#/components/ageAssurance/IsAgeRestricted'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {createStaticClick, InlineLinkText} from '#/components/Link'
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
  const {status, isAgeRestricted, hasInitiated, lastInitiatedAt} =
    useAgeAssuranceContext()
  const control = useDialogControl()
  const appealControl = Dialog.useDialogControl()
  const getTimeAgo = useGetTimeAgo()
  const {gtPhone} = useBreakpoints()
  const copy = useAgeAssuranceCopy()

  const isBlocked = status === 'blocked'
  const timeAgo = lastInitiatedAt
    ? getTimeAgo(lastInitiatedAt, new Date())
    : null

  if (!isAgeRestricted) return null

  return (
    <>
      <AgeAssuranceInitDialog control={control} />
      <AgeAssuranceAppealDialog control={appealControl} />

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

          {isBlocked && (
            <View style={[a.pb_sm]}>
              <Admonition type="warning">
                <Trans>
                  You are currently unable to access Bluesky's Age Assurance
                  flow. Please{' '}
                  <InlineLinkText
                    label={_(msg`Contact our moderation team`)}
                    {...createStaticClick(() => {
                      appealControl.open()
                    })}>
                    contact our moderation team
                  </InlineLinkText>{' '}
                  if you believe this is an error.
                </Trans>
              </Admonition>
            </View>
          )}

          <View
            style={[
              a.justify_between,
              a.align_start,
              gtPhone ? [a.flex_row, a.gap_xl] : [a.gap_md],
            ]}>
            <Text style={[a.text_sm, a.leading_snug]}>{copy.notice}</Text>

            {!isBlocked && (
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
            )}
          </View>
        </View>
      </View>
    </>
  )
}
