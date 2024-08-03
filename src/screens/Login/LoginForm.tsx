import React, {useRef, useState} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  TextInput,
  View,
} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {
  AuthorizeOptions,
  BrowserOAuthClient,
  LoginContinuedInParentWindowError,
  OAuthAgent,
} from '@atproto/oauth-client-browser'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {isNetworkError} from '#/lib/strings/errors'
import {cleanError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useRequestNotificationsPermission} from 'lib/notifications/notifications'
// import {useGate} from 'lib/statsig/statsig'
import {useSetHasCheckedForStarterPack} from 'state/preferences/used-starter-packs'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const client = new BrowserOAuthClient({
  plcDirectoryUrl: 'https://plc.directory',
  handleResolver: 'https://bsky.social',
  clientMetadata: {
    client_id: 'https://.ngrok-free.app/.well-known/client-metadata.json',
    client_name: 'Bluesky',
    redirect_uris: ['https://.ngrok-free.app/auth/callback'],
    token_endpoint_auth_method: 'none',
  },
})

export function useOAuth(client: BrowserOAuthClient) {
  const [agent, setAgent] = useState<null | OAuthAgent>(null)
  const [loading, setLoading] = useState(true)

  const clientRef = useRef<typeof client>()
  React.useEffect(() => {
    // In strict mode, we don't want to reinitialize the client if it's the same
    if (clientRef.current === client) return
    clientRef.current = client

    setLoading(true)
    setAgent(null)

    client
      .init()
      .then(async r => {
        if (clientRef.current !== client) return

        setAgent(r?.agent || null)
      })
      .catch(err => {
        console.error('Failed to init:', err)

        if (clientRef.current !== client) return
        if (err instanceof LoginContinuedInParentWindowError) return

        setAgent(null)
      })
      .finally(() => {
        if (clientRef.current !== client) return

        setLoading(false)
      })
  }, [client])

  React.useEffect(() => {
    if (!agent) return

    const clear = ({detail}: {detail: {sub: string}}) => {
      if (detail.sub === agent.sub) {
        setAgent(null)
      }
    }

    client.addEventListener('deleted', clear)

    return () => {
      client.removeEventListener('deleted', clear)
    }
  }, [client, agent])

  const signOut = React.useCallback(async () => {
    if (!agent) return

    setAgent(null)
    setLoading(true)

    try {
      await agent.signOut()
    } catch (err) {
      console.error('Failed to clear credentials', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [agent])

  const signIn = React.useCallback(
    async (input: string, options?: AuthorizeOptions) => {
      // if (agent) return

      setLoading(true)

      try {
        const agent = await client.signIn(input, options)
        setAgent(agent)
      } catch (err) {
        console.error('Failed to login', err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [client],
  )

  return {
    agent,
    loading,
    signedIn: agent != null,
    signIn,
    signOut,
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
}) => {
  const {track} = useAnalytics()
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isReady, setIsReady] = useState<boolean>(false)
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] =
    useState<boolean>(false)
  const identifierValueRef = useRef<string>(initialHandle || '')
  const passwordValueRef = useRef<string>('')
  const authFactorTokenValueRef = useRef<string>('')
  const passwordRef = useRef<TextInput>(null)
  const {_} = useLingui()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  // const gate = useGate()
  const oauthEnabled = true
  const oauth = useOAuth(client)
  const [handle, setHandle] = React.useState('')

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
    track('Signin:PressedSelectService')
  }, [track])

  const onPressNextOauth = async () => {
    await oauth.signIn(handle)
  }

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setError('')
    setIsProcessing(true)

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current
    const authFactorToken = authFactorTokenValueRef.current

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

      // TODO remove double login
      await login(
        {
          service: serviceUrl,
          identifier: fullIdent,
          password,
          authFactorToken: authFactorToken.trim(),
        },
        'LoginForm',
      )
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
      requestNotificationsPermission('Login')
    } catch (e: any) {
      const errMsg = e.toString()
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setIsProcessing(false)
      if (
        e instanceof ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setIsAuthFactorTokenNeeded(true)
      } else if (errMsg.includes('Token is invalid')) {
        logger.debug('Failed to login due to invalid 2fa token', {
          error: errMsg,
        })
        setError(_(msg`Invalid 2FA confirmation code.`))
      } else if (errMsg.includes('Authentication Required')) {
        logger.debug('Failed to login due to invalid credentials', {
          error: errMsg,
        })
        setError(_(msg`Invalid username or password`))
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

  const checkIsReady = () => {
    if (
      !!serviceDescription &&
      !!identifierValueRef.current &&
      !!passwordValueRef.current
    ) {
      if (!isReady) {
        setIsReady(true)
      }
    } else {
      if (isReady) {
        setIsReady(false)
      }
    }
  }

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
      {oauthEnabled ? (
        <>
          <TextField.LabelText>
            <Trans>Handle</Trans>
          </TextField.LabelText>
          <View style={[a.gap_sm]}>
            <TextField.Root>
              <TextField.Icon icon={At} />
              <TextField.Input
                testID="loginUsernameInput"
                label={_(msg`alice.test`)}
                autoCapitalize="none"
                autoFocus
                autoCorrect={false}
                autoComplete="username"
                returnKeyType="next"
                textContentType="username"
                defaultValue={initialHandle || ''}
                onChangeText={v => {
                  setHandle(v)
                  checkIsReady()
                }}
                onSubmitEditing={() => {
                  // @TODO submit
                }}
                blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
                editable={!isProcessing}
                accessibilityHint={_(msg`Input the handle for your account`)}
              />
            </TextField.Root>
          </View>
        </>
      ) : (
        <>
          <View>
            <TextField.LabelText>
              <Trans>Hosting provider</Trans>
            </TextField.LabelText>
            <HostingProvider
              serviceUrl={serviceUrl}
              onSelectServiceUrl={setServiceUrl}
              onOpenDialog={onPressSelectService}
            />
          </View>
          <View>
            <TextField.LabelText>
              <Trans>Account</Trans>
            </TextField.LabelText>
            <View style={[a.gap_sm]}>
              <TextField.Root>
                <TextField.Icon icon={At} />
                <TextField.Input
                  testID="loginUsernameInput"
                  label={_(msg`Username or email address`)}
                  autoCapitalize="none"
                  autoFocus
                  autoCorrect={false}
                  autoComplete="username"
                  returnKeyType="next"
                  textContentType="username"
                  defaultValue={initialHandle || ''}
                  onChangeText={v => {
                    identifierValueRef.current = v
                    checkIsReady()
                  }}
                  onSubmitEditing={() => {
                    passwordRef.current?.focus()
                  }}
                  blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
                  editable={!isProcessing}
                  accessibilityHint={_(
                    msg`Input the username or email address you used at signup`,
                  )}
                />
              </TextField.Root>

              <TextField.Root>
                <TextField.Icon icon={Lock} />
                <TextField.Input
                  testID="loginPasswordInput"
                  inputRef={passwordRef}
                  label={_(msg`Password`)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  returnKeyType="done"
                  enablesReturnKeyAutomatically={true}
                  secureTextEntry={true}
                  textContentType="password"
                  clearButtonMode="while-editing"
                  onChangeText={v => {
                    passwordValueRef.current = v
                    checkIsReady()
                  }}
                  onSubmitEditing={onPressNext}
                  blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
                  editable={!isProcessing}
                  accessibilityHint={_(msg`Input your password`)}
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
        </>
      )}
      {isAuthFactorTokenNeeded && (
        <View>
          <TextField.LabelText>
            <Trans>2FA Confirmation</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Icon icon={Ticket} />
            <TextField.Input
              testID="loginAuthFactorTokenInput"
              label={_(msg`Confirmation code`)}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              textContentType="username"
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              onChangeText={v => {
                authFactorTokenValueRef.current = v
              }}
              onSubmitEditing={onPressNext}
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Input the code which has been emailed to you`,
              )}
            />
          </TextField.Root>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
            <Trans>Check your email for a login code and enter it here.</Trans>
          </Text>
        </View>
      )}
      <FormError error={error} />
      <View style={[a.flex_row, a.align_center, a.pt_md]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="medium"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries login`)}
            variant="solid"
            color="secondary"
            size="medium"
            onPress={onPressRetryConnect}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : !serviceDescription ? (
          <>
            <ActivityIndicator />
            <Text style={[t.atoms.text_contrast_high, a.pl_md]}>
              <Trans>Connecting...</Trans>
            </Text>
          </>
        ) : isReady || oauthEnabled ? (
          <Button
            testID="loginNextButton"
            label={_(msg`Next`)}
            accessibilityHint={_(msg`Navigates to the next screen`)}
            variant="solid"
            color="primary"
            size="medium"
            onPress={oauthEnabled ? onPressNextOauth : onPressNext}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        ) : undefined}
      </View>
    </FormContainer>
  )
}
