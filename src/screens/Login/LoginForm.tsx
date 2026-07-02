import {useRef, useState} from 'react'
import {Keyboard, type TextInput, View} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {DEFAULT_SERVICE, HITSLOP_10, HITSLOP_20} from '#/lib/constants'
import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {toNiceHostingUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {
  type HostingProviderState,
  useHostingProvider,
} from '#/state/queries/pds-detection'
import {useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, tokens, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon} from '#/components/icons/Chevron'
import {Envelope_Stroke2_Corner0_Rounded as EmailIcon} from '#/components/icons/Envelope'
import {Eye_Stroke2_Corner0_Rounded as EyeIcon} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as TicketIcon} from '#/components/icons/Ticket'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {HostingProviderDialog} from './components/HostingProviderDialog'
import {FormContainer} from './FormContainer'

const DEBUG = false

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

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
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorField, setErrorField] = useState<
    'none' | 'identifier' | 'password' | '2fa'
  >('none')
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] = useState(false)
  const identifierValueRef = useRef(initialHandle || '')
  const passwordValueRef = useRef('')
  const [identifier, setIdentifier] = useState(initialHandle || '')
  const [identifierFocused, setIdentifierFocused] = useState(false)
  const [authFactorToken, setAuthFactorToken] = useState('')
  const identifierRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const hasFocusedOnce = useRef(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [revealPassword, setRevealPassword] = useState(false)
  const {t: l} = useLingui()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()
  const serverInputControl = useDialogControl()
  const hostingProvider = useHostingProvider({
    identifier,
    defaultService: serviceUrl,
  })
  const {gtMobile} = useBreakpoints()

  /*
   * Surface an inline error on the username field only once detection has
   * settled on an unresolvable identifier and the user has moved on from the
   * field. Hidden while focused so we don't nag mid-type, and it clears
   * automatically when the identifier resolves or an override is set (both
   * move `state.status` away from 'unresolved').
   */
  const showUnresolvedError =
    hostingProvider.state.status === 'unresolved' && !identifierFocused

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    setError('')
    setErrorField('none')

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current

    if (!identifier) {
      setError(l`Please enter your username`)
      setErrorField('identifier')
      return
    }

    if (!password) {
      setError(l`Please enter your password`)
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
        !identifier.startsWith('did:') && // not a DID
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

      /*
       * Await autodetection against the current identifier before logging in.
       * If detection is still in flight this waits for it (bypassing the
       * debounce); otherwise it resolves near-instantly from cache. Falls back
       * to the default service on anything unresolvable.
       */
      const service = await hostingProvider.resolveService(identifier)

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
      void requestNotificationsPermission('Login')
    } catch (err) {
      const errMsg = String(err)
      setIsProcessing(false)
      if (
        err instanceof
        ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setIsAuthFactorTokenNeeded(true)
      } else {
        onAttemptFailed()
        if (errMsg.includes('Token is invalid')) {
          logger.debug('Failed to login due to invalid 2fa token', {
            error: errMsg,
          })
          setError(l`Invalid 2FA confirmation code.`)
          setErrorField('2fa')
        } else if (
          errMsg.includes('Authentication Required') ||
          errMsg.includes('Invalid identifier or password')
        ) {
          logger.debug('Failed to login due to invalid credentials', {
            error: errMsg,
          })
          setError(l`Incorrect username or password`)
        } else if (isNetworkError(err)) {
          logger.warn('Failed to login due to network error', {error: errMsg})
          setError(
            l`Unable to contact your service. Please check your Internet connection.`,
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
      <HostingProviderDialog
        control={serverInputControl}
        currentOverride={
          hostingProvider.state.status === 'overridden'
            ? hostingProvider.state.pdsUrl
            : null
        }
        isEmail={hostingProvider.state.status === 'email'}
        onSelectManual={url => {
          hostingProvider.override(url)
          setServiceUrl(url)
        }}
        onSelectAutomatic={() => {
          hostingProvider.clearOverride()
          setServiceUrl(DEFAULT_SERVICE)
        }}
      />
      <View>
        <TextField.LabelText>
          <Trans>Username or email</Trans>
        </TextField.LabelText>
        <TextField.Root
          isInvalid={errorField === 'identifier' || showUnresolvedError}>
          <TextField.Icon
            icon={hostingProvider.state.status === 'email' ? EmailIcon : AtIcon}
          />
          <TextField.Input
            testID="loginUsernameInput"
            inputRef={identifierRef}
            label={l`Username or email address`}
            placeholder={null}
            autoCapitalize="none"
            autoFocus={!IS_IOS}
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            textContentType="username"
            defaultValue={initialHandle || ''}
            onChangeText={v => {
              identifierValueRef.current = v
              setIdentifier(v)
              if (errorField) setErrorField('none')
            }}
            onFocus={() => setIdentifierFocused(true)}
            onBlur={() => setIdentifierFocused(false)}
            onSubmitEditing={() => {
              passwordRef.current?.focus()
            }}
            blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
            editable={!isProcessing}
            accessibilityHint={l`Enter the username or email address you used when you created your account`}
          />
        </TextField.Root>
        {showUnresolvedError && (
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              a.mt_sm,
              {color: t.palette.negative_500},
            ]}>
            <Trans>
              We couldn’t find an account with that username. Double-check it
              for typos, or{' '}
              <InlineLinkText
                label={l`Set your hosting provider manually`}
                style={[a.text_sm, a.leading_snug]}
                {...createStaticClick(() => {
                  Keyboard.dismiss()
                  serverInputControl.open()
                })}>
                set your hosting provider manually
              </InlineLinkText>
              .
            </Trans>
          </Text>
        )}
      </View>

      <View>
        <TextField.LabelText>
          <Trans>Password</Trans>
        </TextField.LabelText>
        <TextField.Root isInvalid={errorField === 'password'}>
          <TextField.Icon icon={LockIcon} />
          <TextField.Input
            testID="loginPasswordInput"
            inputRef={passwordRef}
            label={l`Password`}
            placeholder={null}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            returnKeyType="done"
            enablesReturnKeyAutomatically={true}
            secureTextEntry={!revealPassword}
            onChangeText={v => {
              passwordValueRef.current = v
              if (errorField) setErrorField('none')
              setHasPassword(!!v)
            }}
            onSubmitEditing={() => void onPressNext()}
            blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
            editable={!isProcessing}
            accessibilityHint={l`Enter your password`}
            onLayout={
              IS_IOS
                ? () => {
                    if (hasFocusedOnce.current) return
                    hasFocusedOnce.current = true
                    // kinda dumb, but if we use `autoFocus` to focus
                    // the username input, it happens before the password
                    // input gets rendered. this breaks the password autofill
                    // on iOS (it only does the username part). delaying
                    // it until both inputs are rendered fixes the autofill -sfn
                    identifierRef.current?.focus()
                  }
                : undefined
            }
            hitSlop={{...HITSLOP_20, right: 0}}
          />
          <RevealPasswordButton
            active={revealPassword}
            hasPassword={hasPassword}
            onPress={() => setRevealPassword(r => !r)}
          />
        </TextField.Root>

        <Button
          label={l`Forgot Password?`}
          accessibilityHint={l`Reset your password by sending a code to your email`}
          style={[a.mt_md, a.self_start]}
          hoverStyle={{opacity: 0.5}}
          hitSlop={HITSLOP_10}
          onPress={onPressForgotPassword}>
          <ButtonText style={[t.atoms.text_contrast_medium]}>
            <Trans>Forgot Password?</Trans>
          </ButtonText>
        </Button>
      </View>
      {isAuthFactorTokenNeeded && (
        <View>
          <TextField.LabelText>
            <Trans>2FA Confirmation</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={errorField === '2fa'}>
            <TextField.Icon icon={TicketIcon} />
            <TextField.Input
              testID="loginAuthFactorTokenInput"
              label={l`Confirmation code`}
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
              onSubmitEditing={() => void onPressNext()}
              editable={!isProcessing}
              accessibilityHint={l`Input the code which has been emailed to you`}
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

      {error && <Admonition type="error">{error}</Admonition>}

      <View
        style={[
          a.pt_md,
          gtMobile && [a.justify_between, a.flex_row, a.gap_sm],
        ]}>
        {gtMobile && (
          <>
            <Button
              label={l`Back`}
              color="secondary"
              size="large"
              onPress={onPressBack}>
              <ButtonText>
                <Trans>Back</Trans>
              </ButtonText>
            </Button>

            <View style={[a.ml_auto]}>
              <HostingProviderIndicator
                state={hostingProvider.state}
                onPress={() => {
                  Keyboard.dismiss()
                  serverInputControl.open()
                }}
              />
            </View>
          </>
        )}
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={l`Retry`}
            accessibilityHint={l`Retries signing in`}
            color="primary_subtle"
            size="large"
            onPress={onPressRetryConnect}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : !serviceDescription ? (
          <Button
            label={l`Connecting to service...`}
            size="large"
            color="secondary"
            disabled>
            <ButtonIcon icon={Loader} />
            <ButtonText>Connecting...</ButtonText>
          </Button>
        ) : (
          <Button
            testID="loginNextButton"
            label={l`Sign in`}
            accessibilityHint={l`Navigates to the next screen`}
            color="primary"
            size="large"
            onPress={() => void onPressNext()}>
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>

      {DEBUG && (
        <Text style={a.text_xs}>
          {JSON.stringify(hostingProvider.state, null, 2)}
        </Text>
      )}

      {!gtMobile && (
        <HostingProviderIndicator
          state={hostingProvider.state}
          onPress={() => {
            Keyboard.dismiss()
            serverInputControl.open()
          }}
        />
      )}
    </FormContainer>
  )
}

function RevealPasswordButton({
  active,
  hasPassword,
  onPress,
}: {
  active: boolean
  hasPassword: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const context = TextField.useTextFieldContext()

  const Icon = !active ? EyeSlashIcon : EyeIcon

  if (!hasPassword && !context.focused) return null

  return (
    <View style={[a.z_10, a.pl_sm, {marginRight: tokens.space.xs * -1}]}>
      <Button
        testID="showPasswordButton"
        onPress={onPress}
        label={active ? l`Hide password` : l`Reveal password`}
        color="secondary"
        size="small"
        shape="round"
        style={[a.bg_transparent]}
        hitSlop={tokens.space.sm}>
        <Icon
          size="md"
          style={[
            context.focused ? t.atoms.text : t.atoms.text_contrast_medium,
          ]}
        />
      </Button>
    </View>
  )
}

function HostingProviderIndicator({
  state,
  onPress,
}: {
  state: HostingProviderState
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  console.log(state)
  return (
    <Button
      label={l`Change hosting provider`}
      accessibilityHint={l`Opens a dialog to change the hosting provider you sign in to`}
      style={[a.mt_auto, a.mb_sm, a.self_center]}
      size="small"
      color="secondary"
      variant="ghost"
      onPress={onPress}>
      <ButtonText style={[t.atoms.text_contrast_medium, a.font_normal]}>
        {state.status === 'detected' || state.status === 'overridden' ? (
          <Trans>Hosting provider: {toNiceHostingUrl(state.pdsUrl)}</Trans>
        ) : state.status === 'email' ? (
          <Trans>Hosting provider: Bluesky</Trans>
        ) : (
          <Trans>Hosting provider</Trans>
        )}
      </ButtonText>
      <TinyChevronIcon width={8} style={[t.atoms.text_contrast_medium]} />
    </Button>
  )
}
