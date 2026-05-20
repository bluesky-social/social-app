import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {dateDiff, useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {regionName} from '#/locale/helpers'
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
import {useAgeAssurance} from '#/ageAssurance'
import {useComputeAgeAssuranceRegionAccess} from '#/ageAssurance/useComputeAgeAssuranceRegionAccess'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {
  type Geolocation,
  useDeviceGeolocationApi,
  useGeolocation,
} from '#/geolocation'
import {USRegionNameToRegionCode} from '#/geolocation/util'
import {device, useStorage} from '#/storage'

const USRegionCodeToRegionName: {[regionCode: string]: string} =
  Object.fromEntries(
    Object.entries(USRegionNameToRegionCode).map(([name, code]) => [
      code,
      name,
    ]),
  )

function formatRegion(
  geolocation: Geolocation,
  appLang: string,
): string | undefined {
  const {countryCode, regionCode} = geolocation
  if (!countryCode) return undefined
  const country = regionName(countryCode, appLang)
  // If `regionName` couldn't resolve a real name and fell through to the raw
  // code, we'd rather show nothing than a bare ISO code in the prose.
  if (country === countryCode) return undefined
  if (regionCode && countryCode === 'US') {
    const state = USRegionCodeToRegionName[regionCode]
    if (state) return `${state}, ${country}`
  }
  return country
}

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
                  label={l`Verify now`}
                  size="small"
                  variant="solid"
                  color={hasInitiated ? 'secondary' : 'primary'}
                  onPress={() => {
                    control.open()
                    ax.metric('ageAssurance:initDialogOpen', {
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

function RegionNotice() {
  const {t: l, i18n} = useLingui()
  const aa = useAgeAssurance()
  const geolocation = useGeolocation()
  const [deviceGeolocation] = useStorage(device, ['deviceGeolocation'])
  const {setDeviceGeolocation} = useDeviceGeolocationApi()
  const computeAgeAssuranceRegionAccess = useComputeAgeAssuranceRegionAccess()
  const locationControl = Dialog.useDialogControl()

  const region = formatRegion(geolocation, i18n.locale)
  const isGPS = !!deviceGeolocation?.countryCode && IS_NATIVE

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
              <Text style={[a.text_sm, a.font_bold]}>{region}</Text>. This
              estimate may be inaccurate if you're using a VPN.
            </Trans>
          ) : (
            <Trans>
              Based on your network, we think you're in{' '}
              <Text style={[a.text_sm, a.font_bold]}>{region}</Text>. This
              estimate may be inaccurate if you're using a VPN.
            </Trans>
          )}
        </Text>
      )}

      {IS_NATIVE && (
        <Text style={[a.text_sm, a.leading_snug]}>
          <Trans>
            <InlineLinkText
              label={l`Confirm your location`}
              {...createStaticClick(() => {
                locationControl.open()
              })}>
              Tap here to confirm your location.
            </InlineLinkText>
          </Trans>
        </Text>
      )}
    </>
  )
}
