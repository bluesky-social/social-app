import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {wait} from '#/lib/async/wait'
import {isNetworkError, useCleanError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {
  computeGeolocationStatus,
  type GeolocationStatus,
  useGeolocationConfig,
} from '#/state/geolocation'
import {useRequestDeviceLocation} from '#/state/geolocation/useRequestDeviceLocation'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PinLocation_Stroke2_Corner0_Rounded as LocationIcon} from '#/components/icons/PinLocation'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export type Props = {
  onLocationAcquired?: (props: {
    geolocationStatus: GeolocationStatus
    setDialogError: (error: string) => void
    disableDialogAction: () => void
    closeDialog: (callback?: () => void) => void
  }) => void
}

export function DeviceLocationRequestDialog({
  control,
  onLocationAcquired,
}: Props & {
  control: Dialog.DialogOuterProps['control']
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Confirm your location`)}
        style={[web({maxWidth: 380})]}>
        <DeviceLocationRequestDialogInner
          onLocationAcquired={onLocationAcquired}
        />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function DeviceLocationRequestDialogInner({onLocationAcquired}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {close} = Dialog.useDialogContext()
  const requestDeviceLocation = useRequestDeviceLocation()
  const {config} = useGeolocationConfig()
  const cleanError = useCleanError()

  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string>('')
  const [dialogDisabled, setDialogDisabled] = useState(false)

  const onPressConfirm = async () => {
    setError('')
    setIsRequesting(true)

    try {
      const req = await wait(1e3, requestDeviceLocation())

      if (req.granted) {
        const location = req.location

        if (location && location.countryCode) {
          const geolocationStatus = computeGeolocationStatus(location, config)
          onLocationAcquired?.({
            geolocationStatus,
            setDialogError: setError,
            disableDialogAction: () => setDialogDisabled(true),
            closeDialog: close,
          })
        } else {
          setError(_(msg`Failed to resolve location. Please try again.`))
        }
      } else {
        setError(
          _(
            msg`Unable to access location. You'll need to visit your system settings to enable location services for Bluesky.`,
          ),
        )
      }
    } catch (e: any) {
      const {clean, raw} = cleanError(e)
      setError(clean || raw || e.message)
      if (!isNetworkError(e)) {
        logger.error(`blockedGeoOverlay: unexpected error`, {
          safeMessage: e.message,
        })
      }
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <View style={[a.gap_md]}>
      <Text style={[a.text_xl, a.font_heavy]}>
        <Trans>Confirm your location</Trans>
      </Text>
      <View style={[a.gap_sm, a.pb_xs]}>
        <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Tap below to allow Bluesky to access your GPS location. We will then
            use that data to more accurately determine the content and features
            available in your region.
          </Trans>
        </Text>

        <Text
          style={[
            a.text_md,
            a.leading_snug,
            t.atoms.text_contrast_medium,
            a.pb_xs,
          ]}>
          <Trans>
            Your location data is not tracked and does not leave your device.
          </Trans>
        </Text>
      </View>

      {error && (
        <View style={[a.pb_xs]}>
          <Admonition type="error">{error}</Admonition>
        </View>
      )}

      <View style={[a.gap_sm]}>
        {!dialogDisabled && (
          <Button
            disabled={isRequesting}
            label={_(msg`Allow location access`)}
            onPress={onPressConfirm}
            size={isWeb ? 'small' : 'large'}
            color="primary">
            <ButtonIcon icon={isRequesting ? Loader : LocationIcon} />
            <ButtonText>
              <Trans>Allow location access</Trans>
            </ButtonText>
          </Button>
        )}

        {!isWeb && (
          <Button
            label={_(msg`Cancel`)}
            onPress={() => close()}
            size={isWeb ? 'small' : 'large'}
            color="secondary">
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </View>
  )
}
