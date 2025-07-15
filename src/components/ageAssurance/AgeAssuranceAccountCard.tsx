import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useAgeInfo} from '#/state/ageAssurance/useAgeInfo'
import {atoms as a, useBreakpoints, useTheme, type ViewStyleProp} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceAppealDialog} from '#/components/ageAssurance/AgeAssuranceAppealDialog'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {
  AgeAssuranceInitDialog,
  useDialogControl,
} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function AgeAssuranceAccountCard({style}: ViewStyleProp & {}) {
  const {isLoaded, isAgeRestricted, isUnderage} = useAgeInfo()

  if (!isLoaded) return null
  if (isUnderage) return null
  if (!isAgeRestricted) return null

  return <Inner style={style} />
}

function Inner({style}: ViewStyleProp & {}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const control = useDialogControl()
  const appealControl = Dialog.useDialogControl()
  const getTimeAgo = useGetTimeAgo()
  const {gtPhone} = useBreakpoints()

  const copy = useAgeAssuranceCopy()
  const {assurance} = useAgeInfo()
  const isBlocked = assurance.status === 'blocked'
  const hasInitiated = !!assurance.lastInitiatedAt
  const timeAgo = assurance.lastInitiatedAt
    ? getTimeAgo(assurance.lastInitiatedAt, new Date())
    : null

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
          </View>

          <View style={[a.pb_md]}>
            <Text style={[a.text_sm, a.leading_snug]}>{copy.notice}</Text>
          </View>

          {isBlocked ? (
            <Admonition type="warning">
              <Trans>
                You are currently unable to access Bluesky's Age Assurance flow.
                Please{' '}
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
          ) : (
            <>
              <Divider />
              <View
                style={[
                  a.pt_md,
                  a.justify_between,
                  a.align_center,
                  gtPhone ? [a.flex_row, a.gap_xl] : [a.gap_md],
                ]}>
                {assurance.lastInitiatedAt ? (
                  <Text
                    style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}
                    title={i18n.date(assurance.lastInitiatedAt, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}>
                    {timeAgo === 'now' ? (
                      <Trans>Last initiated just {timeAgo}</Trans>
                    ) : (
                      <Trans>Last initiated {timeAgo} ago</Trans>
                    )}
                  </Text>
                ) : (
                  <Text
                    style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
                    <Trans>Age verification takes only a few minutes</Trans>
                  </Text>
                )}
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
            </>
          )}
        </View>
      </View>
    </>
  )
}
