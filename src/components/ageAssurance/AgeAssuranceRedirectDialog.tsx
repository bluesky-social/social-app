import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {retry} from '#/lib/async/retry'
import {wait} from '#/lib/async/wait'
import {useAppviewClient, useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {CheckThick_Stroke2_Corner0_Rounded as SuccessIcon} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {refetchAgeAssuranceServerState} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'

export type AgeAssuranceRedirectDialogState = {
  result: 'success' | 'unknown'
  actorDid: string
}

/**
 * Validate and parse the query parameters returned from the age assurance
 * redirect. If not valid, returns `undefined` and the dialog will not open.
 */
export function parseAgeAssuranceRedirectDialogState(
  state: {
    result?: string
    actorDid?: string
  } = {},
): AgeAssuranceRedirectDialogState | undefined {
  let result: AgeAssuranceRedirectDialogState['result'] = 'unknown'
  const actorDid = state.actorDid

  switch (state.result) {
    case 'success':
      result = 'success'
      break
    case 'unknown':
    default:
      result = 'unknown'
      break
  }

  if (result && actorDid) {
    return {
      result,
      actorDid,
    }
  }
}

export function useAgeAssuranceRedirectDialogControl() {
  return useGlobalDialogsControlContext().ageAssuranceRedirectDialogControl
}

export function AgeAssuranceRedirectDialog() {
  const {_} = useLingui()
  const control = useAgeAssuranceRedirectDialogControl()

  // for testing
  // Dialog.useAutoOpen(control.control, 3e3)

  return (
    <Dialog.Outer control={control.control} onClose={() => control.clear()}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Verifying your age assurance status`)}
        style={[web({maxWidth: 400})]}>
        <Inner optimisticState={control.value} />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function Inner({}: {optimisticState?: AgeAssuranceRedirectDialogState}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const appviewClient = useAppviewClient()
  const control = useAgeAssuranceRedirectDialogControl()
  /*
   * The poll effect is mount-only so a session-bundle rebuild (web cross-tab
   * token sync, which swaps the appview client identity) does not restart the
   * flow or permanently latch it. Read the volatile values through refs kept
   * fresh each render so the next retry attempt picks up the current client.
   */
  const clientRef = useRef(appviewClient)
  clientRef.current = appviewClient
  const hasSessionRef = useRef(hasSession)
  hasSessionRef.current = hasSession
  const openMetricFired = useRef(false)
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!openMetricFired.current) {
      openMetricFired.current = true
      ax.metric('ageAssurance:redirectDialogOpen', {})
    }

    wait(
      3e3,
      retry(
        5,
        () => true,
        async () => {
          if (!hasSessionRef.current) return
          if (cancelled) return

          const data = await refetchAgeAssuranceServerState({
            appviewClient: clientRef.current,
          })

          if (data?.state.status !== 'assured') {
            throw new Error(
              `Polling for age assurance state did not receive assured status`,
            )
          }

          return data
        },
        1e3,
      ),
    )
      .then(async data => {
        if (!data) return
        if (!hasSessionRef.current) return
        if (cancelled) return

        setSuccess(true)

        ax.metric('ageAssurance:redirectDialogSuccess', {})
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        ax.metric('ageAssurance:redirectDialogFail', {})
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (success) {
    return (
      <>
        <View style={[a.align_start, a.w_full]}>
          <AgeAssuranceBadge />

          <View
            style={[
              a.flex_row,
              a.justify_between,
              a.align_center,
              a.gap_sm,
              a.pt_lg,
              a.pb_md,
            ]}>
            <SuccessIcon size="sm" fill={t.palette.positive_500} />
            <Text style={[a.text_xl, a.font_bold]}>
              <Trans>Success</Trans>
            </Text>
          </View>

          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              We've confirmed your age assurance status. You can now close this
              dialog.
            </Trans>
          </Text>

          {IS_NATIVE && (
            <View style={[a.w_full, a.pt_lg]}>
              <Button
                label={_(msg`Close`)}
                size="large"
                variant="solid"
                color="secondary"
                onPress={() => control.control.close()}>
                <ButtonText>
                  <Trans>Close</Trans>
                </ButtonText>
              </Button>
            </View>
          )}
        </View>

        <Dialog.Close />
      </>
    )
  }

  return (
    <>
      <View style={[a.align_start, a.w_full]}>
        <AgeAssuranceBadge />

        <View
          style={[
            a.flex_row,
            a.justify_between,
            a.align_center,
            a.gap_sm,
            a.pt_lg,
            a.pb_md,
          ]}>
          {error && <ErrorIcon size="md" fill={t.palette.negative_500} />}

          <Text style={[a.text_xl, a.font_bold]}>
            {error ? <Trans>Connection issue</Trans> : <Trans>Verifying</Trans>}
          </Text>

          {!error && <Loader size="md" />}
        </View>

        <Text style={[a.text_md, a.leading_snug]}>
          {error ? (
            <Trans>
              We were unable to receive the verification due to a connection
              issue. It may arrive later. If it does, your account will update
              automatically.
            </Trans>
          ) : (
            <Trans>
              We're confirming your age assurance status with our servers. This
              should only take a few seconds.
            </Trans>
          )}
        </Text>

        {error && IS_NATIVE && (
          <View style={[a.w_full, a.pt_lg]}>
            <Button
              label={_(msg`Close`)}
              size="large"
              variant="solid"
              color="secondary"
              onPress={() => control.control.close()}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </View>

      {error && <Dialog.Close />}
    </>
  )
}
