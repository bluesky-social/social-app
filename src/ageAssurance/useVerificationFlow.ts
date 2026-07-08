import {useCallback, useState} from 'react'
import type * as AgeRange from 'expo-age-range'
import {useLingui} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {type DialogControlProps} from '#/components/Dialog'
import * as Toast from '#/components/Toast'
import {useAgeAssurance} from '#/ageAssurance'
import {getDeviceSignals, setDeviceSignalsForRegion} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {unsafeGetAndComputeAgeAssurance} from '#/ageAssurance/state'
import {
  getAgeAssuranceDataFromDeviceSignals,
  useAgeAssuranceRegionConfig,
} from '#/ageAssurance/util'
import {useAnalytics} from '#/analytics'

/**
 * Shared "Verify now" flow for the age assurance surfaces (the no-access screen
 * and the account settings card). Handles the device-first verification path
 * with a KWS fallback, keeping the two entry points in sync.
 *
 * The caller owns the KWS dialog (`AgeAssuranceInitDialog`) and passes its
 * `initDialogControl` here so we can open it for the fallback / opt-in cases.
 *
 * Returns:
 * - `onPressVerify`: the button handler. In device-verification regions it
 *   prompts the OS age API, persists a sufficient result (region-bound), and
 *   toasts the outcome; otherwise (or on any missing/failed device response) it
 *   opens the KWS dialog.
 * - `openInitDialog`: opens the KWS dialog directly (for the inline "use KWS"
 *   link), emitting the same metric as the fallback path.
 * - `isVerifying`: true while the OS age prompt is up, for a button
 *   loading state.
 * - `verifyCta`: the localized button label for the current mode.
 */
export function useAgeAssuranceVerificationFlow({
  initDialogControl,
}: {
  initDialogControl: DialogControlProps
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const region = useAgeAssuranceRegionConfig()
  const aa = useAgeAssurance()
  const hasInitiated = !!aa.state.lastInitiatedAt
  const allowsDeviceVerification = region && aa.flags.allowsDeviceVerification

  const [isVerifying, setIsVerifying] = useState(false)
  /*
   * In-memory only, and scoped to this hook instance: each surface using this
   * hook tracks its own failure, and a remount (or another surface) starts
   * fresh and will offer the device flow again. That's intentional for now -
   * it's a soft "don't immediately re-offer" signal, not a persisted judgment
   * that the device can't provide signals.
   */
  const [deviceSignalsFailed, setDeviceSignalsFailed] = useState(false)

  const verifyCta =
    allowsDeviceVerification && !deviceSignalsFailed
      ? l`Share age range`
      : hasInitiated
        ? l`Verify again`
        : l`Verify now`

  const openInitDialog = useCallback(() => {
    initDialogControl.open()
    ax.metric('ageAssurance:initDialogOpen', {
      hasInitiatedPreviously: hasInitiated,
    })
  }, [initDialogControl, ax, hasInitiated])

  const onPressVerify = useCallback(async () => {
    const did = currentAccount?.did

    // Just for typescript, these surfaces aren't shown without a logged in user
    if (!did) return

    /*
     * In regions that permit on-device verification, try the native age API
     * first. We tag the result with the current region (device assurance is
     * region-bound — a TX grant only counts in TX) and, if it's sufficient,
     * persist it client-side so the AA state recompute lifts the gate.
     *
     * Once the OS returns a response we stay on the device path and report the
     * outcome via a toast (sufficient, under-age, or no usable data) rather than
     * silently falling back — users can still opt into KWS via the inline link.
     * We only fall through to the KWS dialog below when the device can't give us
     * a response at all: `getDeviceSignals` handles its own errors and returns
     * undefined (e.g. on web or failure).
     */
    if (allowsDeviceVerification && !deviceSignalsFailed) {
      // Show a loading state while the OS age prompt is up.
      setIsVerifying(true)
      let signals: AgeRange.AgeRangeResponse | undefined
      try {
        signals = await getDeviceSignals()
      } finally {
        setIsVerifying(false)
      }
      if (signals) {
        const {assuredAge} = getAgeAssuranceDataFromDeviceSignals(
          region,
          signals,
        )
        if (assuredAge !== undefined) {
          // Persist (keyed by this region) so the AA state recomputes from the
          // cache write. Recompute here too so we can react to the outcome: a
          // sufficient age lifts the gate (nothing more to do), but the device
          // may report an age below the region's threshold, in which case
          // access stays `none` and we tell the user.
          setDeviceSignalsForRegion({did, region, signals})
          const {state} = unsafeGetAndComputeAgeAssurance({did})
          if (state.access === aa.Access.None) {
            Toast.show(
              l`We're sorry, but based on the data shared by your device, you are not old enough to access Bluesky.`,
              {type: 'info'},
            )
          } else if (state.access === aa.Access.Unknown) {
            Toast.show(
              l`Hmm, it seems we weren't able to compute your level of access. Please try again.`,
              {type: 'warning'},
            )
          } else if (state.access === aa.Access.Safe) {
            Toast.show(
              l`You're all set! However, certain features may still be restricted until you're able to verify you're an adult.`,
              {
                type: 'success',
              },
            )
          } else {
            Toast.show(l`You're all set!`, {
              type: 'success',
            })
          }
          return
        }
        // We got a device response but it carried no usable age information.
        Toast.show(
          l`Hmm, it seems your device was unable to share age information with us.`,
          {type: 'warning'},
        )
        setDeviceSignalsFailed(true)
        return
      }
      logger.debug(
        `onPressVerify: no device signals available (web/error), falling back to KWS`,
      )
    }

    openInitDialog()
  }, [
    region,
    currentAccount?.did,
    openInitDialog,
    allowsDeviceVerification,
    aa,
    l,
    deviceSignalsFailed,
    setDeviceSignalsFailed,
  ])

  return {
    onPressVerify,
    openInitDialog,
    isVerifying,
    verifyCta,
    deviceSignalsFailed,
  }
}
