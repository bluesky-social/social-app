import {useCallback, useEffect, useRef, useState} from 'react'
import {Keyboard, type TextInput, View} from 'react-native'
import Animated, {FadeIn} from 'react-native-reanimated'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type QueryClient, useQueryClient} from '@tanstack/react-query'

import {isBlueskyHostedPds, ResolvePdsError} from '#/lib/api/resolve-pds'
import {BSKY_SERVICE, DEFAULT_SERVICE} from '#/lib/constants'
import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {enforceLen} from '#/lib/strings/helpers'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {
  looksResolvable,
  resolvePdsQueryOptions,
  useResolvePdsQuery,
} from '#/state/queries/resolve-pds'
import {useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, ios, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ServerInputDialog} from '#/components/dialogs/ServerInput'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_IOS, IS_WEB} from '#/env'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

/**
 * Truncate a host for display so an unexpectedly long (or unparseable, e.g. a
 * pasted blob) server string can't blow out the layout. Middle-truncation
 * keeps the recognizable start and the TLD/port.
 */
function niceHostLabel(url: string): string {
  return enforceLen(toNiceDomain(url), 32, true, 'middle')
}

// Upper bound on how long a submit will wait for host resolution before
// falling back to the default service, so a slow lookup can never trap the
// Sign in button.
const RESOLVE_ON_SUBMIT_TIMEOUT_MS = 2e3

/**
 * Best-effort host resolution at submit time. Reuses any in-flight or cached
 * resolution (same query key as the background hook) and only fires a request
 * if none exists. Returns the resolved PDS, or undefined on timeout/failure so
 * the caller falls back to the default service.
 */
async function resolvePdsOnSubmit(
  queryClient: QueryClient,
  handle: string,
): Promise<string | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      queryClient.fetchQuery(resolvePdsQueryOptions(handle)),
      new Promise<undefined>(resolve => {
        timer = setTimeout(
          () => resolve(undefined),
          RESOLVE_ON_SUBMIT_TIMEOUT_MS,
        )
      }),
    ])
    return result?.pds
  } catch {
    // Bad handle, network error, or no PDS in the DID doc. Fall back to the
    // default service - login will surface any genuine auth error.
    return undefined
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
}) => {
  const t = useTheme()
  const ax = useAnalytics()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorField, setErrorField] = useState<
    'none' | 'identifier' | 'password' | '2fa'
  >('none')
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] = useState(false)
  const identifierValueRef = useRef<string>(initialHandle || '')
  const resolveDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const passwordValueRef = useRef<string>('')
  const [authFactorToken, setAuthFactorToken] = useState('')
  const identifierRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const hasFocusedOnce = useRef<boolean>(false)
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  // Handle for PDS resolution. Mirrors identifierValueRef but as state so the
  // query key updates. Set on blur (and on submit) to avoid a request per keystroke.
  const [handleForResolve, setHandleForResolve] = useState(initialHandle || '')
  // If the user explicitly picks a custom server via the fallback link, that
  // overrides the resolved PDS.
  const [customServerOverride, setCustomServerOverride] = useState<
    string | undefined
  >(undefined)
  const serverInputControl = useDialogControl()
  const resolveStartRef = useRef<number>(0)

  const resolveQuery = useResolvePdsQuery(handleForResolve, {
    enabled: !customServerOverride,
  })

  // Track timing for the resolve-success analytics event.
  useEffect(() => {
    if (resolveQuery.isFetching) {
      resolveStartRef.current = Date.now()
    }
  }, [resolveQuery.isFetching])

  // Fire analytics on resolve success/failure.
  useEffect(() => {
    if (resolveQuery.isSuccess && resolveQuery.data) {
      ax.metric('signin:pdsResolve:success', {
        durationMs: Date.now() - resolveStartRef.current,
        isBlueskySocial: isBlueskyHostedPds(resolveQuery.data.pds),
      })
    }
  }, [resolveQuery.isSuccess, resolveQuery.data, ax])
  useEffect(() => {
    if (resolveQuery.isError) {
      const reason =
        resolveQuery.error instanceof ResolvePdsError
          ? resolveQuery.error.reason
          : 'network'
      ax.metric('signin:pdsResolve:failure', {reason})
    }
  }, [resolveQuery.isError, resolveQuery.error, ax])

  const onSelectCustomServer = useCallback(
    (url: string) => {
      // Empty string = user cleared the input and tapped Done -> clear override.
      // BSKY_SERVICE = user dismissed the dialog without picking a custom server
      // (the dialog defaults aren't supposed to override anything).
      // Both cases fall back to auto-resolve.
      if (url === '' || url === BSKY_SERVICE) {
        setCustomServerOverride(undefined)
        setServiceUrl(DEFAULT_SERVICE)
        // Make sure resolution has a chance to run with the current handle
        // value, in case the user opened the dialog before the field blurred.
        setHandleForResolve(identifierValueRef.current)
        return
      }
      setCustomServerOverride(url)
      setServiceUrl(url)
      ax.metric('signin:customServerUsed', {})
    },
    [setServiceUrl, ax],
  )

  const onPressUseCustomServer = useCallback(() => {
    Keyboard.dismiss()
    serverInputControl.open()
  }, [serverInputControl])

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    setError('')
    setErrorField('none')

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current

    if (!identifier) {
      setError(_(msg`Please enter your username`))
      setErrorField('identifier')
      return
    }

    if (!password) {
      setError(_(msg`Please enter your password`))
      setErrorField('password')
      return
    }

    setIsProcessing(true)

    try {
      // try to guess the handle if the user just gave their own username
      let fullIdent = identifier
      if (
        !identifier.includes('@') && // not an email
        !identifier.includes('.') && // not a domain
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullIdent.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullIdent = createFullHandle(
            identifier,
            serviceDescription.availableUserDomains[0],
          )
        }
      }

      // Keep the status message in sync with the submitted handle.
      if (handleForResolve !== fullIdent) {
        setHandleForResolve(fullIdent)
      }

      // Pick the service to sign in to. A custom server override always wins.
      // Otherwise ensure host resolution has finished first: a fast submit
      // (e.g. password-manager autofill) can beat the background lookup and
      // wrongly default to the main service.
      let service = customServerOverride ?? serviceUrl
      if (!customServerOverride && looksResolvable(fullIdent)) {
        const resolvedPds = await resolvePdsOnSubmit(queryClient, fullIdent)
        if (resolvedPds) service = resolvedPds
      }

      // TODO remove double login
      await login(
        {
          service,
          identifier: fullIdent,
          password,
          authFactorToken: authFactorToken.trim(),
        },
        'LoginForm',
      )
      onAttemptSuccess()
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
      requestNotificationsPermission('Login')
    } catch (e: any) {
      const errMsg = e.toString()
      setIsProcessing(false)
      if (
        e instanceof ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setIsAuthFactorTokenNeeded(true)
      } else {
        onAttemptFailed()
        if (errMsg.includes('Token is invalid')) {
          logger.debug('Failed to login due to invalid 2fa token', {
            error: errMsg,
          })
          setError(_(msg`Invalid 2FA confirmation code.`))
          setErrorField('2fa')
        } else if (
          errMsg.includes('Authentication Required') ||
          errMsg.includes('Invalid identifier or password')
        ) {
          logger.debug('Failed to login due to invalid credentials', {
            error: errMsg,
          })
          setError(_(msg`Incorrect username or password`))
        } else if (isNetworkError(e)) {
          logger.warn('Failed to login due to network error', {error: errMsg})
          setError(
            _(
              msg`Unable to contact your service. Please check your Internet connection.`,
            ),
          )
        } else {
          logger.warn('Failed to login', {error: errMsg})
          setError(cleanError(errMsg))
        }
      }
    }
  }

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
      <ServerInputDialog
        control={serverInputControl}
        onSelect={onSelectCustomServer}
        customOnly
      />
      <View>
        <View style={[a.gap_sm]}>
          <TextField.Root isInvalid={errorField === 'identifier'}>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="loginUsernameInput"
              inputRef={identifierRef}
              label={_(msg`Username or email address`)}
              autoCapitalize="none"
              autoFocus={!IS_IOS}
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              textContentType="username"
              defaultValue={initialHandle || ''}
              onChangeText={v => {
                identifierValueRef.current = v
                if (errorField) setErrorField('none')
                // Debounce the resolution trigger so it fires shortly after
                // the user stops typing, not on every keystroke.
                if (resolveDebounceRef.current) {
                  clearTimeout(resolveDebounceRef.current)
                }
                resolveDebounceRef.current = setTimeout(() => {
                  setHandleForResolve(v)
                }, 400)
              }}
              onBlur={() => {
                if (resolveDebounceRef.current) {
                  clearTimeout(resolveDebounceRef.current)
                }
                setHandleForResolve(identifierValueRef.current)
              }}
              onSubmitEditing={() => {
                if (resolveDebounceRef.current) {
                  clearTimeout(resolveDebounceRef.current)
                }
                setHandleForResolve(identifierValueRef.current)
                passwordRef.current?.focus()
              }}
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Enter the username or email address you used when you created your account`,
              )}
            />
          </TextField.Root>

          <TextField.Root isInvalid={errorField === 'password'}>
            <TextField.Icon icon={Lock} />
            <TextField.Input
              testID="loginPasswordInput"
              inputRef={passwordRef}
              label={_(msg`Password`)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
              secureTextEntry={true}
              clearButtonMode="while-editing"
              onChangeText={v => {
                passwordValueRef.current = v
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={onPressNext}
              blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
              editable={!isProcessing}
              accessibilityHint={_(msg`Enter your password`)}
              onLayout={ios(() => {
                if (hasFocusedOnce.current) return
                hasFocusedOnce.current = true
                // kinda dumb, but if we use `autoFocus` to focus
                // the username input, it happens before the password
                // input gets rendered. this breaks the password autofill
                // on iOS (it only does the username part). delaying
                // it until both inputs are rendered fixes the autofill -sfn
                identifierRef.current?.focus()
              })}
            />
            <Button
              testID="forgotPasswordButton"
              onPress={onPressForgotPassword}
              label={_(msg`Forgot password?`)}
              accessibilityHint={_(msg`Opens password reset form`)}
              variant="solid"
              color="secondary"
              style={[
                a.rounded_sm,
                // t.atoms.bg_contrast_100,
                {marginLeft: 'auto', left: 6, padding: 6},
                a.z_10,
              ]}>
              <ButtonText>
                <Trans>Forgot?</Trans>
              </ButtonText>
            </Button>
          </TextField.Root>
        </View>
      </View>
      {isAuthFactorTokenNeeded && (
        <View>
          <TextField.LabelText>
            <Trans>2FA Confirmation</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={errorField === '2fa'}>
            <TextField.Icon icon={Ticket} />
            <TextField.Input
              testID="loginAuthFactorTokenInput"
              label={_(msg`Confirmation code`)}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="one-time-code"
              returnKeyType="done"
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              value={authFactorToken} // controlled input due to uncontrolled input not receiving pasted values properly
              onChangeText={text => {
                setAuthFactorToken(text)
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={onPressNext}
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Input the code which has been emailed to you`,
              )}
              style={{
                textTransform: authFactorToken === '' ? 'none' : 'uppercase',
              }}
            />
          </TextField.Root>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
            <Trans>
              Check your email for a sign in code and enter it here.
            </Trans>
          </Text>
        </View>
      )}
      <FormError error={error} />
      <View style={[a.pt_md, web([a.flex_row, a.align_center, a.gap_md])]}>
        {IS_WEB && (
          <Button
            label={_(msg`Back`)}
            color="secondary"
            size="large"
            onPress={onPressBack}>
            <ButtonText>
              <Trans>Back</Trans>
            </ButtonText>
          </Button>
        )}
        <View style={[web([a.flex_1, {minWidth: 0}]), native([a.pb_md])]}>
          <PdsResolveStatus
            query={resolveQuery}
            override={customServerOverride}
            handle={handleForResolve}
            onPressUseCustomServer={onPressUseCustomServer}
          />
        </View>
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries signing in`)}
            color="primary_subtle"
            size="large"
            onPress={onPressRetryConnect}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : !serviceDescription ? (
          <Button
            label={_(msg`Connecting to service...`)}
            size="large"
            color="secondary"
            disabled>
            <ButtonIcon icon={Loader} />
            <ButtonText>Connecting...</ButtonText>
          </Button>
        ) : (
          <Button
            testID="loginNextButton"
            label={_(msg`Sign in`)}
            accessibilityHint={_(msg`Navigates to the next screen`)}
            color="primary"
            size="large"
            onPress={onPressNext}>
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>
    </FormContainer>
  )
}

function PdsResolveStatus({
  query,
  override,
  handle,
  onPressUseCustomServer,
}: {
  query: ReturnType<typeof useResolvePdsQuery>
  override: string | undefined
  handle: string
  onPressUseCustomServer: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  // Only surface a "Resolving..." state if the fetch is actually slow enough
  // to be perceptible. Most resolutions complete in <300ms, in which case
  // flashing a loading message just makes the form look noisy. After 600ms,
  // we assume the user is genuinely waiting and could use feedback.
  const [showLoading, setShowLoading] = useState(false)
  useEffect(() => {
    if (!query.isFetching) {
      const raf = requestAnimationFrame(() => setShowLoading(false))
      return () => cancelAnimationFrame(raf)
    }
    const timer = setTimeout(() => setShowLoading(true), 600)
    return () => clearTimeout(timer)
  }, [query.isFetching])

  let content: React.ReactNode = null
  let contentKey = 'empty'
  if (override) {
    contentKey = 'override:' + override
    content = (
      <Text
        style={[a.text_sm, t.atoms.text_contrast_medium, web(a.text_right)]}>
        <Trans>You're signing in to {niceHostLabel(override)}.</Trans>{' '}
        <InlineLinkText
          label={_(msg`Change server`)}
          {...createStaticClick(onPressUseCustomServer)}
          style={[a.text_sm]}>
          <Trans>Change</Trans>
        </InlineLinkText>
      </Text>
    )
  } else if (!handle || !handle.includes('.') || handle.includes('@')) {
    // Nothing typed yet, partial handle, or an email (legacy login flow).
    content = null
  } else if (query.isFetching) {
    if (!showLoading) {
      // Fetch is still in flight but hasn't been slow enough to surface yet.
      // Render nothing instead of a transient flash.
      return null
    }
    contentKey = 'loading'
    content = (
      <View
        accessibilityLabel={_(msg`Resolving your server`)}
        accessibilityHint=""
        style={[web(a.align_end)]}>
        <Loader size="md" />
      </View>
    )
  } else if (query.isError) {
    contentKey = 'error'
    content = (
      <View style={[a.gap_2xs]}>
        <Text
          style={[
            a.text_sm,
            a.leading_snug,
            t.atoms.text_contrast_medium,
            web(a.text_right),
          ]}>
          <Trans>Couldn't find your server.</Trans>
        </Text>
        <InlineLinkText
          label={_(msg`Use a custom server`)}
          {...createStaticClick(onPressUseCustomServer)}
          style={[a.text_sm, a.leading_snug, web(a.text_right)]}>
          <Trans>Use a custom server</Trans>
        </InlineLinkText>
      </View>
    )
  } else if (query.data) {
    // For the default case (account hosted on any Bluesky-operated PDS, which
    // includes the *.host.bsky.network shards), hide the subtitle - the user
    // already expects that and the confirmation just adds noise. Only show
    // when the resolved PDS is something else worth confirming.
    if (isBlueskyHostedPds(query.data.pds)) {
      return null
    }
    contentKey = 'resolved:' + query.data.pds
    content = (
      <Text
        style={[a.text_sm, t.atoms.text_contrast_medium, web(a.text_right)]}>
        <Trans>You're signing in to {niceHostLabel(query.data.pds)}</Trans>
      </Text>
    )
  }

  if (!content) return null
  return <FadeInWrapper key={contentKey}>{content}</FadeInWrapper>
}

/**
 * Fades in its children on mount. Uses `react-native-reanimated`'s FadeIn on
 * native and a CSS opacity transition on web - the latter because reanimated
 * layout animations don't reliably trigger entering animations on web.
 */
function FadeInWrapper({children}: {children: React.ReactNode}) {
  const [opacity, setOpacity] = useState(0)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpacity(1))
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <Animated.View
      entering={native(FadeIn.duration(200))}
      style={web([
        a.transition_opacity,
        {transitionDuration: '200ms', opacity},
      ])}>
      {children}
    </Animated.View>
  )
}
