import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {retry} from '#/lib/async/retry'
import {wait} from '#/lib/async/wait'
import {isNative} from '#/platform/detection'
import {useAgeAssuranceAPIContext} from '#/state/ageAssurance'
import {logger} from '#/state/ageAssurance/util'
import {useAgent} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {CheckThick_Stroke2_Corner0_Rounded as SuccessIcon} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

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

  // TODO for testing
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
  const {_} = useLingui()
  const agent = useAgent()
  const polling = useRef(false)
  const unmounted = useRef(false)
  const control = useAgeAssuranceRedirectDialogControl()
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const {refetch: refreshAgeAssuranceState} = useAgeAssuranceAPIContext()

  useEffect(() => {
    if (polling.current) return

    polling.current = true

    logger.metric('ageAssurance:redirectDialogOpen', {})

    wait(
      3e3,
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
      ),
    )
      .then(async data => {
        if (!data) return
        if (!agent.session) return
        if (unmounted.current) return

        // success! update state
        await refreshAgeAssuranceState()

        setSuccess(true)

        logger.metric('ageAssurance:redirectDialogSuccess', {})
      })
      .catch(() => {
        if (unmounted.current) return
        setError(true)
        // try a refetch anyway
        refreshAgeAssuranceState()
        logger.metric('ageAssurance:redirectDialogFail', {})
      })

    return () => {
      unmounted.current = true
    }
  }, [agent, control, refreshAgeAssuranceState])

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
            <SuccessIcon size="sm" fill={t.palette.positive_600} />
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

          {isNative && (
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

        {error && isNative && (
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
