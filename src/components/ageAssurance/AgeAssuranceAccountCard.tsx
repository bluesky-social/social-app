import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {dateDiff, useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
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
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DeviceLocationRequestDialog} from '#/components/dialogs/DeviceLocationRequestDialog'
import {Divider} from '#/components/Divider'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useComputeAgeAssuranceRegionAccess} from '#/ageAssurance/useComputeAgeAssuranceRegionAccess'
import {useAgeAssuranceVerificationFlow} from '#/ageAssurance/useVerificationFlow'
import {createGeolocationString} from '#/ageAssurance/util'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {useDeviceGeolocationApi, useGeolocation} from '#/geolocation'

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
  const {t: l, i18n} = useLingui()
  const ax = useAnalytics()
  const control = useDialogControl()
  const appealControl = Dialog.useDialogControl()
  const getTimeAgo = useGetTimeAgo()
  const {gtPhone} = useBreakpoints()

  const copy = useAgeAssuranceCopy()
  const aa = useAgeAssurance()
  const {status, lastInitiatedAt} = aa.state
  const isBlocked = status === aa.Status.Blocked
  const hasInitiated = !!lastInitiatedAt
  const hasCompletedFlow = status === aa.Status.Assured
  const timeAgo = lastInitiatedAt
    ? getTimeAgo(lastInitiatedAt, new Date())
    : null
  const diff = lastInitiatedAt
    ? dateDiff(lastInitiatedAt, new Date(), 'down')
    : null
  const {onPressVerify, openInitDialog, isVerifying, verifyCta} =
    useAgeAssuranceVerificationFlow({initDialogControl: control})

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

          <View style={[a.pb_md, a.gap_sm]}>
            <Text style={[a.text_sm, a.leading_snug]}>{copy.notice}</Text>
            {hasCompletedFlow && (
              <Text style={[a.text_sm, a.leading_snug]}>
                <Trans>
                  If you are 18 years of age or older and want to try again,
                  click the button below and use a different verification method
                  if one is available in your region. If you have questions or
                  concerns,{' '}
                  <InlineLinkText
                    label={l`Contact our support team`}
                    {...createStaticClick(() => {
                      appealControl.open()
                    })}>
                    our support team can help.
                  </InlineLinkText>
                </Trans>
              </Text>
            )}

            <RegionNotice />
          </View>

          {isBlocked ? (
            <Admonition type="warning">
              <Trans>
                You are currently unable to access Bluesky's Age Assurance flow.
                Please{' '}
                <InlineLinkText
                  label={l`Contact our moderation team`}
                  {...createStaticClick(() => {
                    appealControl.open()
                    ax.metric('ageAssurance:appealDialogOpen', {})
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
                  label={verifyCta}
                  size="small"
                  color={
                    hasInitiated || aa.flags.hasSharedDeviceSignals
                      ? 'secondary'
                      : 'primary'
                  }
                  disabled={isVerifying}
                  onPress={() => void onPressVerify()}>
                  <ButtonIcon icon={isVerifying ? Loader : ShieldIcon} />
                  <ButtonText>{verifyCta}</ButtonText>
                </Button>

                {aa.flags.allowsDeviceVerification ? (
                  <Text
                    style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
                    <Trans>
                      Sharing your age data uses information stored on your
                      device, and will therefore only work on this device.
                      Alternatively,{' '}
                      <InlineLinkText
                        label={l`Verify now using KWS`}
                        {...createStaticClick(() => {
                          openInitDialog()
                        })}>
                        you can use our trusted partner, KWS
                      </InlineLinkText>
                      , to complete your verification and enable access on all
                      platforms.
                    </Trans>
                  </Text>
                ) : lastInitiatedAt && timeAgo && diff ? (
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

function RegionNotice() {
  const {t: l, i18n} = useLingui()
  const aa = useAgeAssurance()
  const geolocation = useGeolocation()
  const {setDeviceGeolocation} = useDeviceGeolocationApi()
  const computeAgeAssuranceRegionAccess = useComputeAgeAssuranceRegionAccess()
  const locationControl = Dialog.useDialogControl()

  const region = createGeolocationString(geolocation, i18n.locale)
  const isGPS = !!geolocation.deviceGeolocation?.countryCode && IS_NATIVE

  return (
    <>
      {IS_NATIVE && (
        <DeviceLocationRequestDialog
          control={locationControl}
          onLocationAcquired={props => {
            const access = computeAgeAssuranceRegionAccess(props.geolocation)
            if (access !== aa.Access.Full) {
              props.disableDialogAction()
              props.setDialogError(
                l`We're sorry, but based on your device's location, you are currently located in a region that requires age assurance.`,
              )
            } else {
              props.closeDialog(() => {
                // set this after close!
                setDeviceGeolocation(props.geolocation)
                Toast.show(l`Thanks! You're all set.`, {
                  type: 'success',
                })
              })
            }
          }}
        />
      )}

      {region && (
        <Text style={[a.text_sm, a.leading_snug]}>
          {isGPS ? (
            <Trans>
              Based on your device's location, we think you're in{' '}
              <Text style={[a.text_sm, a.font_bold]}>{region}</Text>.
            </Trans>
          ) : (
            <Trans>
              Based on your network, we think you're in{' '}
              <Text style={[a.text_sm, a.font_bold]}>{region}</Text>. This
              estimate may be inaccurate if you're using a VPN.
            </Trans>
          )}
          {IS_NATIVE && (
            <Text style={[a.text_sm, a.leading_snug]}>
              {' '}
              <Trans>
                <InlineLinkText
                  label={l`Update your location`}
                  {...createStaticClick(() => {
                    locationControl.open()
                  })}>
                  Tap here to update your location with GPS.
                </InlineLinkText>
              </Trans>
            </Text>
          )}
        </Text>
      )}
    </>
  )
}
