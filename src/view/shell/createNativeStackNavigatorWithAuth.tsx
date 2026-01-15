import * as React from 'react'
import {View} from 'react-native'
// Based on @react-navigation/native-stack/src/navigators/createNativeStackNavigator.ts
// MIT License
// Copyright (c) 2017 React Navigation Contributors
import {
  createNavigatorFactory,
  type EventArg,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackActionHelpers,
  StackActions,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type StaticConfig,
  type TypedNavigator,
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
import {useSession} from '#/state/session'
import {useOnboardingState} from '#/state/shell'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {LoggedOut} from '#/view/com/auth/LoggedOut'
import {Onboarding} from '#/screens/Onboarding'
import {SignupQueued} from '#/screens/SignupQueued'
import {atoms as a, useLayoutBreakpoints} from '#/alf'
import {PolicyUpdateOverlay} from '#/components/PolicyUpdateOverlay'
import {IS_NATIVE, IS_WEB} from '#/env'
import {BottomBarWeb} from './bottom-bar/BottomBarWeb'
import {DesktopLeftNav} from './desktop/LeftNav'
import {DesktopRightNav} from './desktop/RightNav'

type NativeStackNavigationOptionsWithAuth = NativeStackNavigationOptions & {
  requireAuth?: boolean
}

function NativeStackNavigator({
  id,
  initialRouteName,
  UNSTABLE_routeNamesChangeBehavior,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
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
      UNSTABLE_routeNamesChangeBehavior,
      children,
      layout,
      screenListeners,
      screenOptions,
      screenLayout,
      UNSTABLE_router,
    })

  React.useEffect(
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
  const {showLoggedOut} = useLoggedOutView()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const {isMobile} = useWebMediaQueries()
  const {leftNavMinimal} = useLayoutBreakpoints()
  if (!hasSession && (!PWI_ENABLED || activeRouteRequiresAuth || IS_NATIVE)) {
    return <LoggedOut />
  }
  if (hasSession && currentAccount?.signupQueued) {
    return <SignupQueued />
  }
  if (showLoggedOut) {
    return <LoggedOut onDismiss={() => setShowLoggedOut(false)} />
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
          return <View />
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
          descriptors={descriptors}
          describe={describe}
        />
      </View>
      {IS_WEB && (
        <>
          {showBottomBar ? <BottomBarWeb /> : <DesktopLeftNav />}
          {!isMobile && <DesktopRightNav routeName={activeRoute.name} />}
        </>
      )}

      {/* Only shown after logged in and onboaring etc are complete */}
      {hasSession && <PolicyUpdateOverlay />}
    </NavigationContent>
  )
}

export function createNativeStackNavigatorWithAuth<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = string | undefined,
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
