import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Dimensions, View} from 'react-native'
import * as Linking from 'expo-linking'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {retry} from '#/lib/async/retry'
import {wait} from '#/lib/async/wait'
import {parseLinkingUrl} from '#/lib/parseLinkingUrl'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, platform, useBreakpoints, useTheme} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {Button, ButtonText} from '#/components/Button'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {CheckThick_Stroke2_Corner0_Rounded as SuccessIcon} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {refetchAgeAssuranceServerState} from '#/ageAssurance'
import {logger} from '#/ageAssurance'
import {IS_WEB} from '#/env'
import {IS_IOS} from '#/env'

export type RedirectOverlayState = {
  result: 'success' | 'unknown'
  actorDid: string
}

/**
 * Validate and parse the query parameters returned from the age assurance
 * redirect. If not valid, returns `undefined` and the dialog will not open.
 */
export function parseRedirectOverlayState(
  state: {
    result?: string
    actorDid?: string
  } = {},
): RedirectOverlayState | undefined {
  let result: RedirectOverlayState['result'] = 'unknown'
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

  if (actorDid) {
    return {
      result,
      actorDid,
    }
  }
}

const Context = createContext<{
  isOpen: boolean
  open: (state: RedirectOverlayState) => void
  close: () => void
}>({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function useRedirectOverlayContext() {
  return useContext(Context)
}

export function Provider({children}: {children?: React.ReactNode}) {
  const {currentAccount} = useSession()
  const incomingUrl = Linking.useLinkingURL()
  const [state, setState] = useState<RedirectOverlayState | null>(() => {
    if (!incomingUrl) return null
    const url = parseLinkingUrl(incomingUrl)
    if (url.pathname !== '/intent/age-assurance') return null
    const params = url.searchParams
    const state = parseRedirectOverlayState({
      result: params.get('result') ?? undefined,
      actorDid: params.get('actorDid') ?? undefined,
    })

    if (IS_WEB) {
      // Clear the URL parameters so they don't re-trigger
      history.pushState(null, '', '/')
    }

    /*
     * If we don't have an account or the account doesn't match, do
     * nothing. By the time the user switches to their other account, AA
     * state should be ready for them.
     */
    if (state && currentAccount && state.actorDid === currentAccount.did) {
      return state
    }

    return null
  })
  const open = useCallback((state: RedirectOverlayState) => {
    setState(state)
  }, [])
  const close = useCallback(() => {
    setState(null)
  }, [])

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          isOpen: state !== null,
          open,
          close,
        }),
        [state, open, close],
      )}>
      {children}
    </Context.Provider>
  )
}

export function RedirectOverlay() {
  const t = useTheme()
  const {_} = useLingui()
  const {isOpen} = useRedirectOverlayContext()
  const {gtMobile} = useBreakpoints()

  return isOpen ? (
    <FullWindowOverlay>
      <View
        style={[
          a.fixed,
          a.inset_0,
          // setting a zIndex when using FullWindowOverlay on iOS
          // means the taps pass straight through to the underlying content (???)
          // so don't set it on iOS. FullWindowOverlay already does the job.
          !IS_IOS && {zIndex: 9999},
          t.atoms.bg,
          gtMobile ? a.p_2xl : a.p_xl,
          a.align_center,
          // @ts-ignore
          platform({
            web: {
              paddingTop: '35vh',
            },
            default: {
              paddingTop: Dimensions.get('window').height * 0.35,
            },
          }),
        ]}>
        <View
          role="dialog"
          aria-role="dialog"
          aria-label={_(msg`Verifying your age assurance status`)}>
          <View style={[a.pb_3xl, {width: 300}]}>
            <Inner />
          </View>
        </View>
      </View>
    </FullWindowOverlay>
  ) : null
}

function Inner() {
  const t = useTheme()
  const {_} = useLingui()
  const agent = useAgent()
  const polling = useRef(false)
  const unmounted = useRef(false)
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const {close} = useRedirectOverlayContext()

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

          const data = await refetchAgeAssuranceServerState({agent})

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
        if (!agent.session) return
        if (unmounted.current) return

        setSuccess(true)

        logger.metric('ageAssurance:redirectDialogSuccess', {})
      })
      .catch(() => {
        if (unmounted.current) return
        setError(true)
        logger.metric('ageAssurance:redirectDialogFail', {})
      })

    return () => {
      unmounted.current = true
    }
  }, [agent])

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
            <Text style={[a.text_3xl, a.font_bold]}>
              <Trans>Success</Trans>
            </Text>
          </View>

          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              We've confirmed your age assurance status. You can now close this
              dialog.
            </Trans>
          </Text>

          <View style={[a.w_full, a.pt_lg]}>
            <Button
              label={_(msg`Close`)}
              size="large"
              variant="solid"
              color="secondary"
              onPress={() => close()}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
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
          {error && <ErrorIcon size="lg" fill={t.palette.negative_500} />}

          <Text style={[a.text_3xl, a.font_bold]}>
            {error ? <Trans>Connection issue</Trans> : <Trans>Verifying</Trans>}
          </Text>

          {!error && <Loader size="lg" />}
        </View>

        <Text style={[a.text_md, t.atoms.text_contrast_medium, a.leading_snug]}>
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

        {error && (
          <View style={[a.w_full, a.pt_lg]}>
            <Button
              label={_(msg`Close`)}
              size="large"
              variant="solid"
              color="secondary"
              onPress={() => close()}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </View>
    </>
  )
}
