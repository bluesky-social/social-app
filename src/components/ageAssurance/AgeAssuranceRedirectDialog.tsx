import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {retry} from '#/lib/async/retry'
import {isNative} from '#/platform/detection'
import {createAgeAssuranceQueryKey} from '#/state/age-assurance'
import {useAgent} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export type AgeAssuranceRedirectDialogState = {
  status: 'success' | 'unknown'
  did: string
}

/**
 * Validate and parse the query parameters returned from the age assurance
 * redirect. If not valid, returns `undefined` and the dialog will not open.
 */
export function parseAgeAssuranceRedirectDialogState(
  state: {
    status?: string
    did?: string
  } = {},
): AgeAssuranceRedirectDialogState | undefined {
  let status: AgeAssuranceRedirectDialogState['status'] = 'unknown'
  const did = state.did

  switch (state.status) {
    case 'success':
      status = 'success'
      break
    case 'unknown':
    default:
      status = 'unknown'
      break
  }

  if (status && did) {
    return {
      status,
      did,
    }
  }
}

export function useAgeAssuranceRedirectDialogControl() {
  return useGlobalDialogsControlContext().ageAssuranceRedirectDialogControl
}

export function AgeAssuranceRedirectDialog() {
  const {_} = useLingui()
  const control = useAgeAssuranceRedirectDialogControl()

  // Dialog.useAutoOpen(control.control, 1e3)

  // TODO maybe handle invalid DID here

  return (
    <Dialog.Outer control={control.control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Verifying your age verification status`)}
        style={[web({maxWidth: 400})]}>
        <Inner optimisticState={control.value} />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function Inner({}: {optimisticState?: AgeAssuranceRedirectDialogState}) {
  const t = useTheme()
  const {_} = useLingui()
  const qc = useQueryClient()
  const agent = useAgent()
  const polling = useRef(false)
  const unmounted = useRef(false)
  const control = useAgeAssuranceRedirectDialogControl()
  const [error, setError] = useState(false)

  useEffect(() => {
    if (polling.current) return

    polling.current = true

    retry(
      5,
      () => true,
      async () => {
        if (!agent.session) return
        if (unmounted.current) return

        const {data} = await agent.app.bsky.unspecced.getAgeAssuranceState()

        if (data.status !== 'assured') {
          throw new Error(
            `Polling for age assurance state did not receive assured status`,
          )
        }

        return data
      },
      1e3,
    )
      .then(data => {
        if (!data) return
        if (!agent.session) return
        if (unmounted.current) return

        qc.setQueryData(createAgeAssuranceQueryKey(agent.session.did), data)

        control.clear()
        control.control.close()
      })
      .catch(() => {
        if (unmounted.current) return
        setError(true)
      })

    return () => {
      unmounted.current = true
    }
  }, [agent, qc, control])

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

          <Text style={[a.text_xl, a.font_heavy]}>
            {error ? <Trans>Unknown status</Trans> : <Trans>Verifying</Trans>}
          </Text>

          {!error && <Loader size="md" />}
        </View>

        <Text style={[a.text_md, a.leading_snug]}>
          {error ? (
            <Trans>
              We were unable to verify your age assurance status. But don't
              worry! Your account should be updated soon.
            </Trans>
          ) : (
            <Trans>
              We're confirming your status with our servers. This dialog should
              close in a few seconds.
            </Trans>
          )}
        </Text>

        {error && isNative && (
          <View style={[a.w_full, a.pt_lg]}>
            <Button
              label={_(msg`Close`)}
              size="large"
              variant="solid"
              color="secondary">
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
