import React, {useRef, useState} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  type TextInput,
  View,
} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {isNetworkError} from '#/lib/strings/errors'
import {cleanError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {colors} from '#/lib/styles'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {useProfilesQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {AccountItem} from '#/components/AccountList'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
// import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
// import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
// import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  // setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
  account,
  pendingDid,
  setServiceUrl,
}: {
  account: null | SessionAccount
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
  pendingDid: string | null
}) => {
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] =
    useState<boolean>(false)
  const [isAuthFactorTokenValueEmpty, setIsAuthFactorTokenValueEmpty] =
    useState<boolean>(true)
  const identifierValueRef = useRef<string>(initialHandle || '')
  const passwordValueRef = useRef<string>('')
  const authFactorTokenValueRef = useRef<string>('')
  const passwordRef = useRef<TextInput>(null)
  const {_} = useLingui()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()
  const {currentAccount, accounts} = useSession()
  const {data: profiles} = useProfilesQuery({
    handles: accounts.map(acc => acc.did),
  })
  // const onPressSelectService = React.useCallback(() => {
  //   Keyboard.dismiss()
  // }, [])

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setError('')

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current
    const authFactorToken = authFactorTokenValueRef.current

    if (!identifier) {
      setError(_(msg`Please enter your email address`))
      return
    }

    if (!password) {
      setError(_(msg`Please enter your password`))
      return
    }

    if (password.length < 8) {
      setError(_(msg`Your password must be at least 8 characters long.`))
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
      onAttemptSuccess()
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
      } else {
        onAttemptFailed()
        if (errMsg.includes('Token is invalid')) {
          logger.debug('Failed to login due to invalid 2fa token', {
            error: errMsg,
          })
          setError(_(msg`Invalid 2FA confirmation code.`))
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
  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
  }, [])

  return (
    <FormContainer testID="loginForm" style={a.px_0}>
      <Button
        style={[a.self_start, a.mx_2xl]}
        label={_(msg`Cancel`)}
        variant="solid"
        color="soft_neutral"
        size="small"
        onPress={onPressBack}>
        <ButtonText>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
      <View
        style={[
          a.self_center,
          a.pb_5xl_8,
          a.pt_s50,
          a.px_md,
          a.mb_md,
          a.mt_lg,
          a.border_0,
          a.rounded_full,
          a.mx_2xl,
          {
            backgroundColor: colors.black,
          },
        ]}>
        <Logo width={104} fill={colors.white} />
      </View>
      <Text
        style={[
          a.self_center,
          a.text_4xl,
          a.font_bold,
          account ? a.mb_md : a.mb_xl,
          a.mx_2xl,
        ]}>
        <Trans>Sign in to Gander.</Trans>
      </Text>
      {account ? null : (
        <View style={[a.mx_2xl, a.mb_md]}>
          <HostingProvider
            serviceUrl={serviceUrl}
            onSelectServiceUrl={setServiceUrl}
            onOpenDialog={onPressSelectService}
          />
        </View>
      )}

      <View
        style={[
          account ? a.mx_lg : a.mx_2xl,
          {
            borderTopRightRadius: 8,
            borderTopLeftRadius: 8,
            overflow: 'hidden',
          },
        ]}>
        {account ? (
          <AccountItem
            profile={profiles?.profiles.find(p => p.did === account.did)}
            account={account}
            onSelect={() => {}}
            isCurrentAccount={account.did === currentAccount?.did}
            isPendingAccount={account.did === pendingDid}
            hideEndIcon={true}
          />
        ) : (
          <TextField.Root>
            <TextField.Input
              isFirst={true}
              testID="loginUsernameInput"
              label={_(msg`Username or Email Address`)}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              textContentType="username"
              defaultValue={initialHandle || ''}
              onChangeText={v => {
                identifierValueRef.current = v
              }}
              onSubmitEditing={() => {
                passwordRef.current?.focus()
              }}
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Enter the username or email address you used when you created your account`,
              )}
            />
          </TextField.Root>
        )}

        <TextField.Root>
          <TextField.Input
            isLast={!account && true}
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
            defaultValue=""
            onChangeText={v => {
              passwordValueRef.current = v
            }}
            onSubmitEditing={onPressNext}
            blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
            editable={!isProcessing}
            accessibilityHint={_(msg`Enter your password`)}
          />
          <Button
            testID="forgotPasswordButton"
            onPress={onPressForgotPassword}
            label={_(msg`Forgot password?`)}
            accessibilityHint={_(msg`Opens password reset form`)}
            variant="ghost"
            color="link">
            <ButtonText>
              <Trans>Forgot?</Trans>
            </ButtonText>
          </Button>
        </TextField.Root>
      </View>

      {isAuthFactorTokenNeeded && (
        <View style={a.mx_2xl}>
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
              autoComplete="one-time-code"
              returnKeyType="done"
              textContentType="username"
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              onChangeText={v => {
                setIsAuthFactorTokenValueEmpty(v === '')
                authFactorTokenValueRef.current = v
              }}
              onSubmitEditing={onPressNext}
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Input the code which has been emailed to you`,
              )}
              style={[
                {
                  textTransform: isAuthFactorTokenValueEmpty
                    ? 'none'
                    : 'uppercase',
                },
              ]}
            />
          </TextField.Root>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
            <Trans>
              Check your email for a sign in code and enter it here.
            </Trans>
          </Text>
        </View>
      )}
      <View style={a.mx_2xl}>
        <FormError error={error} />
      </View>
      <View style={a.flex_1} />
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.pt_lg,
          a.border_t,
          a.px_2xl,
          {borderColor: '#D8D8D8'},
        ]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries signing in`)}
            variant="solid"
            color="secondary"
            size="large"
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
        ) : (
          <Button
            testID="loginNextButton"
            label={_(msg`Next`)}
            accessibilityHint={_(msg`Navigates to the next screen`)}
            variant="solid"
            color="primary"
            size="large"
            onPress={onPressNext}>
            <ButtonText>
              <Trans>Agree and continue</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>
    </FormContainer>
  )
}
