import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {dateDiff, useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {isNative} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme, type ViewStyleProp} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceAppealDialog} from '#/components/ageAssurance/AgeAssuranceAppealDialog'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {AgeAssuranceConfigUnavailableError} from '#/components/ageAssurance/AgeAssuranceErrors'
import {
  AgeAssuranceInitDialog,
  useDialogControl,
} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DeviceLocationRequestDialog} from '#/components/dialogs/DeviceLocationRequestDialog'
import {Divider} from '#/components/Divider'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {logger, useAgeAssurance} from '#/ageAssurance'
import {useComputeAgeAssuranceRegionAccess} from '#/ageAssurance/useComputeAgeAssuranceRegionAccess'
import {useDeviceGeolocationApi} from '#/geolocation'

export function AgeAssuranceAccountCard({style}: ViewStyleProp & {}) {
  const aa = useAgeAssurance()
  if (aa.state.access === aa.Access.Full) return null
  if (aa.state.error === 'config') {
    return (
      <View style={style}>
        <AgeAssuranceConfigUnavailableError />
      </View>
    )
  }
  return <Inner style={style} />
}

function Inner({style}: ViewStyleProp & {}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const control = useDialogControl()
  const appealControl = Dialog.useDialogControl()
  const locationControl = Dialog.useDialogControl()
  const getTimeAgo = useGetTimeAgo()
  const {gtPhone} = useBreakpoints()
  const {setDeviceGeolocation} = useDeviceGeolocationApi()
  const computeAgeAssuranceRegionAccess = useComputeAgeAssuranceRegionAccess()

  const copy = useAgeAssuranceCopy()
  const aa = useAgeAssurance()
  const {status, lastInitiatedAt} = aa.state
  const isBlocked = status === aa.Status.Blocked
  const hasInitiated = !!lastInitiatedAt
  const timeAgo = lastInitiatedAt
    ? getTimeAgo(lastInitiatedAt, new Date())
    : null
  const diff = lastInitiatedAt
    ? dateDiff(lastInitiatedAt, new Date(), 'down')
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

          <View style={[a.pb_md, a.gap_xs]}>
            <Text style={[a.text_sm, a.leading_snug]}>{copy.notice}</Text>

            {isNative && (
              <>
                <Text style={[a.text_sm, a.leading_snug]}>
                  <Trans>
                    Is your location not accurate?{' '}
                    <InlineLinkText
                      label={_(msg`Confirm your location`)}
                      {...createStaticClick(() => {
                        locationControl.open()
                      })}>
                      Tap here to confirm your location.
                    </InlineLinkText>{' '}
                  </Trans>
                </Text>

                <DeviceLocationRequestDialog
                  control={locationControl}
                  onLocationAcquired={props => {
                    const access = computeAgeAssuranceRegionAccess(
                      props.geolocation,
                    )
                    if (access !== aa.Access.Full) {
                      props.disableDialogAction()
                      props.setDialogError(
                        _(
                          msg`We're sorry, but based on your device's location, you are currently located in a region that requires age assurance.`,
                        ),
                      )
                    } else {
                      props.closeDialog(() => {
                        // set this after close!
                        setDeviceGeolocation(props.geolocation)
                        Toast.show(_(msg`Thanks! You're all set.`), {
                          type: 'success',
                        })
                      })
                    }
                  }}
                />
              </>
            )}
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
                    logger.metric('ageAssurance:appealDialogOpen', {})
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
                  gtPhone
                    ? [
                        a.flex_row_reverse,
                        a.gap_xl,
                        a.justify_between,
                        a.align_center,
                      ]
                    : [a.gap_md],
                ]}>
                <Button
                  label={_(msg`Verify now`)}
                  size="small"
                  variant="solid"
                  color={hasInitiated ? 'secondary' : 'primary'}
                  onPress={() => {
                    control.open()
                    logger.metric('ageAssurance:initDialogOpen', {
                      hasInitiatedPreviously: hasInitiated,
                    })
                  }}>
                  <ButtonText>
                    {hasInitiated ? (
                      <Trans>Verify again</Trans>
                    ) : (
                      <Trans>Verify now</Trans>
                    )}
                  </ButtonText>
                </Button>

                {lastInitiatedAt && timeAgo && diff ? (
                  <Text
                    style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}
                    title={i18n.date(lastInitiatedAt, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}>
                    {diff.value === 0 ? (
                      <Trans>Last initiated just now</Trans>
                    ) : (
                      <Trans>Last initiated {timeAgo} ago</Trans>
                    )}
                  </Text>
                ) : (
                  <Text
                    style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
                    <Trans>Age assurance only takes a few minutes</Trans>
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </>
  )
}
