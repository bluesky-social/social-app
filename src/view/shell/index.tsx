import {useCallback, useEffect, useState} from 'react'
import {BackHandler, useWindowDimensions, View} from 'react-native'
import {Drawer} from 'react-native-drawer-layout'
import {SystemBars} from 'react-native-edge-to-edge'
import {Gesture} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useNavigation, useNavigationState} from '@react-navigation/native'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {useIntentHandler} from '#/lib/hooks/useIntentHandler'
import {useNotificationsHandler} from '#/lib/hooks/useNotificationHandler'
import {useNotificationsRegistration} from '#/lib/notifications/notifications'
import {isStateAtTabRoot} from '#/lib/routes/helpers'
import {useDialogFullyExpandedCountContext} from '#/state/dialogs'
import {useSession} from '#/state/session'
import {
  useIsDrawerOpen,
  useIsDrawerSwipeDisabled,
  useSetDrawerOpen,
} from '#/state/shell'
import {useCloseAnyActiveElement} from '#/state/util'
import {Lightbox} from '#/view/com/lightbox/Lightbox'
import {ModalsContainer} from '#/view/com/modals/Modal'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Deactivated} from '#/screens/Deactivated'
import {Takendown} from '#/screens/Takendown'
import {atoms as a, select, useTheme} from '#/alf'
import {setSystemUITheme} from '#/alf/util/systemUI'
import {AgeAssuranceRedirectDialog} from '#/components/ageAssurance/AgeAssuranceRedirectDialog'
import {EmailDialog} from '#/components/dialogs/EmailDialog'
import {InAppBrowserConsentDialog} from '#/components/dialogs/InAppBrowserConsent'
import {LinkWarningDialog} from '#/components/dialogs/LinkWarning'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {NuxDialogs} from '#/components/dialogs/nuxs'
import {SigninDialog} from '#/components/dialogs/Signin'
import {GlobalReportDialog} from '#/components/moderation/ReportDialog'
import {
  Outlet as PolicyUpdateOverlayPortalOutlet,
  usePolicyUpdateContext,
} from '#/components/PolicyUpdateOverlay'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {useAgeAssurance} from '#/ageAssurance'
import {NoAccessScreen} from '#/ageAssurance/components/NoAccessScreen'
import {RedirectOverlay} from '#/ageAssurance/components/RedirectOverlay'
import {IS_ANDROID, IS_IOS} from '#/env'
import {RoutesContainer, TabsNavigator} from '#/Navigation'
import {BottomSheetOutlet} from '../../../modules/bottom-sheet'
import {updateActiveViewAsync} from '../../../modules/expo-bluesky-swiss-army/src/VisibilityView'
import {Composer} from './Composer'
import {DrawerContent} from './Drawer'

function ShellInner() {
  const winDim = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const {state: policyUpdateState} = usePolicyUpdateContext()

  const closeAnyActiveElement = useCloseAnyActiveElement()

  useNotificationsRegistration()
  useNotificationsHandler()

  useEffect(() => {
    if (IS_ANDROID) {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        return closeAnyActiveElement()
      })

      return () => {
        listener.remove()
      }
    }
  }, [closeAnyActiveElement])

  // HACK
  // expo-video doesn't like it when you try and move a `player` to another `VideoView`. Instead, we need to actually
  // unregister that player to let the new screen register it. This is only a problem on Android, so we only need to
  // apply it there.
  // The `state` event should only fire whenever we push or pop to a screen, and should not fire consecutively quickly.
  // To be certain though, we will also dedupe these calls.
  const navigation = useNavigation()
  const dedupe = useDedupe(1000)
  useEffect(() => {
    if (!IS_ANDROID) return
    const onFocusOrBlur = () => {
      setTimeout(() => {
        dedupe(updateActiveViewAsync)
      }, 500)
    }
    navigation.addListener('state', onFocusOrBlur)
    return () => {
      navigation.removeListener('state', onFocusOrBlur)
    }
  }, [dedupe, navigation])

  const drawerLayout = useCallback(
    ({children}: {children: React.ReactNode}) => (
      <DrawerLayout>{children}</DrawerLayout>
    ),
    [],
  )

  return (
    <>
      <View style={[a.h_full]}>
        <ErrorBoundary
          style={{paddingTop: insets.top, paddingBottom: insets.bottom}}>
          <TabsNavigator layout={drawerLayout} />
        </ErrorBoundary>
      </View>

      <Composer winHeight={winDim.height} />
      <ModalsContainer />
      <MutedWordsDialog />
      <SigninDialog />
      <EmailDialog />
      <AgeAssuranceRedirectDialog />
      <InAppBrowserConsentDialog />
      <LinkWarningDialog />
      <Lightbox />
      <NuxDialogs />
      <GlobalReportDialog />

      {/* Until policy update has been completed by the user, don't render anything that is portaled */}
      {policyUpdateState.completed && (
        <>
          <PortalOutlet />
          <BottomSheetOutlet />
        </>
      )}

      <PolicyUpdateOverlayPortalOutlet />
    </>
  )
}

function DrawerLayout({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const isDrawerOpen = useIsDrawerOpen()
  const setIsDrawerOpen = useSetDrawerOpen()
  const isDrawerSwipeDisabled = useIsDrawerSwipeDisabled()
  const winDim = useWindowDimensions()

  const canGoBack = useNavigationState(state => !isStateAtTabRoot(state))
  const {hasSession} = useSession()

  const swipeEnabled = !canGoBack && hasSession && !isDrawerSwipeDisabled
  const [trendingScrollGesture] = useState(() => Gesture.Native())

  const renderDrawerContent = useCallback(() => <DrawerContent />, [])
  const onOpenDrawer = useCallback(
    () => setIsDrawerOpen(true),
    [setIsDrawerOpen],
  )
  const onCloseDrawer = useCallback(
    () => setIsDrawerOpen(false),
    [setIsDrawerOpen],
  )

  return (
    <Drawer
      renderDrawerContent={renderDrawerContent}
      drawerStyle={{width: Math.min(400, winDim.width * 0.8)}}
      configureGestureHandler={handler => {
        handler = handler.requireExternalGestureToFail(trendingScrollGesture)

        if (swipeEnabled) {
          if (isDrawerOpen) {
            return handler.activeOffsetX([-1, 1])
          } else {
            return (
              handler
                // Any movement to the left is a pager swipe
                // so fail the drawer gesture immediately.
                .failOffsetX(-1)
                // Don't rush declaring that a movement to the right
                // is a drawer swipe. It could be a vertical scroll.
                .activeOffsetX(5)
            )
          }
        } else {
          // Fail the gesture immediately.
          // This seems more reliable than the `swipeEnabled` prop.
          // With `swipeEnabled` alone, the gesture may freeze after toggling off/on.
          return handler.failOffsetX([0, 0]).failOffsetY([0, 0])
        }
      }}
      open={isDrawerOpen}
      onOpen={onOpenDrawer}
      onClose={onCloseDrawer}
      swipeEdgeWidth={winDim.width}
      swipeMinVelocity={100}
      swipeMinDistance={10}
      drawerType={IS_IOS ? 'slide' : 'front'}
      overlayStyle={{
        backgroundColor: select(t.name, {
          light: 'rgba(0, 57, 117, 0.1)',
          dark: IS_ANDROID
            ? 'rgba(16, 133, 254, 0.1)'
            : 'rgba(1, 82, 168, 0.1)',
          dim: 'rgba(10, 13, 16, 0.8)',
        }),
      }}>
      {children}
    </Drawer>
  )
}

export function Shell() {
  const t = useTheme()
  const aa = useAgeAssurance()
  const {currentAccount} = useSession()
  const fullyExpandedCount = useDialogFullyExpandedCountContext()

  useIntentHandler()

  useEffect(() => {
    setSystemUITheme('theme', t)
  }, [t])

  return (
    <View testID="mobileShellView" style={[a.h_full, t.atoms.bg]}>
      <SystemBars
        style={{
          statusBar:
            t.name !== 'light' || (IS_IOS && fullyExpandedCount > 0)
              ? 'light'
              : 'dark',
          navigationBar: t.name !== 'light' ? 'light' : 'dark',
        }}
      />
      {currentAccount?.status === 'takendown' ? (
        <Takendown />
      ) : currentAccount?.status === 'deactivated' ? (
        <Deactivated />
      ) : (
        <>
          {aa.state.access === aa.Access.None ? (
            <NoAccessScreen />
          ) : (
            <RoutesContainer>
              <ShellInner />
            </RoutesContainer>
          )}

          <RedirectOverlay />
        </>
      )}
    </View>
  )
}
