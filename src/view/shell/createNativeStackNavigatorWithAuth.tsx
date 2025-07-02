import {useCallback, useEffect} from 'react'
import {View} from 'react-native'
// Based on @react-navigation/native-stack/src/navigators/createNativeStackNavigator.ts
// MIT License
// Copyright (c) 2017 React Navigation Contributors
import {
  createNavigatorFactory,
  type EventArg,
  type NavigationProp,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackActionHelpers,
  StackActions,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type StaticConfig,
  type TypedNavigator,
  useFocusEffect,
  useNavigation,
  useNavigationBuilder,
} from '@react-navigation/native'
import {NativeStackView} from '@react-navigation/native-stack'
import {
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
  type NativeStackNavigatorProps,
} from '@react-navigation/native-stack'

import {PWI_ENABLED} from '#/lib/build-flags'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {type FlatNavigatorParams} from '#/lib/routes/types'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useOnboardingState} from '#/state/shell'
import {useLoggedOutView} from '#/state/shell/logged-out'
import {Deactivated} from '#/screens/Deactivated'
import {Onboarding} from '#/screens/Onboarding'
import {SignupQueued} from '#/screens/SignupQueued'
import {Takendown} from '#/screens/Takendown'
import {atoms as a, useLayoutBreakpoints} from '#/alf'
import {BottomBarWeb} from './bottom-bar/BottomBarWeb'
import {DesktopLeftNav} from './desktop/LeftNav'
import {DesktopRightNav} from './desktop/RightNav'

type NativeStackNavigationOptionsWithAuth = NativeStackNavigationOptions & {
  requireAuth?: boolean
}

function NativeStackNavigator({
  id,
  initialRouteName,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  ...rest
}: NativeStackNavigatorProps) {
  // --- this is copy and pasted from the original native stack navigator ---
  const {state, describe, descriptors, navigation, NavigationContent} =
    useNavigationBuilder<
      StackNavigationState<ParamListBase>,
      StackRouterOptions,
      StackActionHelpers<ParamListBase>,
      NativeStackNavigationOptionsWithAuth,
      NativeStackNavigationEventMap
    >(StackRouter, {
      id,
      initialRouteName,
      children,
      layout,
      screenListeners,
      screenOptions,
      screenLayout,
    })

  useEffect(
    () =>
      // @ts-expect-error: there may not be a tab navigator in parent
      navigation?.addListener?.('tabPress', (e: any) => {
        const isFocused = navigation.isFocused()

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          if (
            state.index > 0 &&
            isFocused &&
            !(e as EventArg<'tabPress', true>).defaultPrevented
          ) {
            // When user taps on already focused tab and we're inside the tab,
            // reset the stack to replicate native behaviour
            navigation.dispatch({
              ...StackActions.popToTop(),
              target: state.key,
            })
          }
        })
      }),
    [navigation, state.index, state.key],
  )

  // --- our custom logic starts here ---
  const {hasSession, currentAccount} = useSession()
  const activeRoute = state.routes[state.index]
  const activeDescriptor = descriptors[activeRoute.key]
  const activeRouteRequiresAuth = activeDescriptor.options.requireAuth ?? false
  const onboardingState = useOnboardingState()
  const {isMobile} = useWebMediaQueries()
  const {leftNavMinimal} = useLayoutBreakpoints()
  const {showLoggedOut} = useLoggedOutView()

  const shouldRedirectToAuth =
    isWeb && activeRoute.name !== 'Auth' && (showLoggedOut || !PWI_ENABLED)
  useEffect(() => {
    if (shouldRedirectToAuth) {
      navigation.navigate('Auth')
    }
  }, [navigation, shouldRedirectToAuth])

  const shouldRedirectAwayFromAuth =
    isWeb &&
    activeRoute.name === 'Auth' &&
    !showLoggedOut &&
    PWI_ENABLED &&
    !activeRouteRequiresAuth
  useEffect(() => {
    if (shouldRedirectAwayFromAuth) {
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.replace('Home')
      }
    }
  }, [navigation, shouldRedirectAwayFromAuth])

  if (hasSession && currentAccount?.signupQueued) {
    return <SignupQueued />
  }
  if (hasSession && currentAccount?.status === 'takendown') {
    return <Takendown />
  }
  if (currentAccount?.status === 'deactivated') {
    return <Deactivated />
  }
  if (onboardingState.isActive) {
    return <Onboarding />
  }
  const newDescriptors: typeof descriptors = {}
  for (let key in descriptors) {
    const descriptor = descriptors[key]
    const requireAuth = descriptor.options.requireAuth ?? false
    newDescriptors[key] = {
      ...descriptor,
      render() {
        if (requireAuth && !hasSession) {
          return <RedirectToAuth />
        } else {
          return descriptor.render()
        }
      },
    }
  }

  // Show the bottom bar if we have a session only on mobile web. If we don't have a session, we want to show it
  // on both tablet and mobile web so that we see the create account CTA.
  const showBottomBar = hasSession ? isMobile : leftNavMinimal

  return (
    <NavigationContent>
      <View role="main" style={a.flex_1}>
        <NativeStackView
          {...rest}
          state={state}
          navigation={navigation}
          descriptors={newDescriptors}
          describe={describe}
        />
      </View>
      {isWeb && (
        <>
          {showBottomBar ? <BottomBarWeb /> : <DesktopLeftNav />}
          {!isMobile && <DesktopRightNav routeName={activeRoute.name} />}
        </>
      )}
    </NavigationContent>
  )
}

/**
 * Redirects to the auth screen on web. On native, this is handled by swapping
 * out the screens instead - see `NativeNavigator`
 */
function RedirectToAuth() {
  const navigation = useNavigation<NavigationProp<FlatNavigatorParams>>()
  useFocusEffect(
    useCallback(() => {
      if (isWeb) {
        const timeout = setTimeout(() => {
          navigation.navigate('Auth')
        }, 500)
        return () => clearTimeout(timeout)
      }
    }, [navigation]),
  )
  return <View />
}

export function createNativeStackNavigatorWithAuth<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList
    NavigatorID: NavigatorID
    State: StackNavigationState<ParamList>
    ScreenOptions: NativeStackNavigationOptionsWithAuth
    EventMap: NativeStackNavigationEventMap
    NavigationList: {
      [RouteName in keyof ParamList]: NativeStackNavigationProp<
        ParamList,
        RouteName,
        NavigatorID
      >
    }
    Navigator: typeof NativeStackNavigator
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(NativeStackNavigator)(config)
}
