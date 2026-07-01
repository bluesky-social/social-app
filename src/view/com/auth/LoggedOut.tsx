import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {STALE} from '#/state/queries'
import {profilesQueryKey} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import {useSetActiveLanding} from '#/state/shell/landing'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {useEnableMinimalShellMode} from '#/state/shell/minimal-mode'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Login} from '#/screens/Login'
import {JoinRequest} from '#/screens/Messages/JoinRequest'
import {Signup} from '#/screens/Signup'
import {LandingScreen} from '#/screens/StarterPack/StarterPackLandingScreen'
import {atoms as a, native, tokens, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {useAnalytics} from '#/analytics'
import {SplashScreen} from './SplashScreen'

enum ScreenState {
  S_LoginOrCreateAccount,
  S_Login,
  S_CreateAccount,
  S_StarterPack,
  S_GroupChatJoinRequest,
}
export {ScreenState as LoggedOutScreenState}

function getInitialScreenState(requestedAccountSwitchTo?: string): ScreenState {
  switch (requestedAccountSwitchTo) {
    case 'new':
      return ScreenState.S_CreateAccount
    case 'starterpack':
      return ScreenState.S_StarterPack
    case 'groupchat':
      return ScreenState.S_GroupChatJoinRequest
    case undefined:
      return ScreenState.S_LoginOrCreateAccount
    default:
      // DID or other string = login with that account
      return ScreenState.S_Login
  }
}

export function LoggedOut({onDismiss}: {onDismiss?: () => void}) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  useEnableMinimalShellMode()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const initialScreenState = getInitialScreenState(requestedAccountSwitchTo)
  const [screenState, setScreenState] =
    useState<ScreenState>(initialScreenState)
  const {clearRequestedAccount} = useLoggedOutViewControls()
  const setActiveLanding = useSetActiveLanding()

  const queryClient = useQueryClient()
  const {accounts} = useSession()
  const agent = useAgent()
  useEffect(() => {
    const actors = accounts.map(acc => acc.did)
    if (actors.length === 0) return
    void queryClient.prefetchQuery({
      queryKey: profilesQueryKey(actors),
      staleTime: STALE.MINUTES.FIVE,
      queryFn: async () => {
        const res = await agent.getProfiles({actors})
        return res.data
      },
    })
  }, [accounts, agent, queryClient])

  const onPressDismiss = useCallback(() => {
    if (onDismiss) {
      onDismiss()
    }
    clearRequestedAccount()
    // Clear landing context when user dismisses the modal
    setActiveLanding(undefined)
  }, [clearRequestedAccount, onDismiss, setActiveLanding])

  const onPressBack = useCallback(() => {
    if (screenState === initialScreenState) {
      onDismiss?.()
      return
    }

    setScreenState(initialScreenState)
  }, [screenState, initialScreenState, setScreenState, onDismiss])

  return (
    <View
      testID="noSessionView"
      style={[
        a.util_screen_outer,
        t.atoms.bg,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <ErrorBoundary>
        {onDismiss && screenState === ScreenState.S_LoginOrCreateAccount ? (
          <Button
            label={_(msg`Go back`)}
            variant="solid"
            color="secondary_inverted"
            size="small"
            shape="round"
            PressableComponent={native(PressableScale)}
            style={[
              a.absolute,
              {
                top: insets.top + tokens.space.xl,
                right: tokens.space.xl,
                zIndex: 100,
              },
            ]}
            onPress={onPressDismiss}>
            <ButtonIcon icon={XIcon} />
          </Button>
        ) : null}

        {screenState === ScreenState.S_StarterPack ? (
          <LandingScreen setScreenState={setScreenState} />
        ) : screenState === ScreenState.S_GroupChatJoinRequest ? (
          <JoinRequest setScreenState={setScreenState} />
        ) : screenState === ScreenState.S_LoginOrCreateAccount ? (
          <SplashScreen
            onPressSignin={() => {
              setScreenState(ScreenState.S_Login)
              ax.metric('splash:signInPressed', {})
            }}
            onPressCreateAccount={() => {
              setScreenState(ScreenState.S_CreateAccount)
              ax.metric('splash:createAccountPressed', {})
            }}
          />
        ) : undefined}
        {screenState === ScreenState.S_Login ? (
          <Login onPressBack={onPressBack} />
        ) : undefined}
        {screenState === ScreenState.S_CreateAccount ? (
          <Signup onPressBack={onPressBack} />
        ) : undefined}
      </ErrorBoundary>
    </View>
  )
}
