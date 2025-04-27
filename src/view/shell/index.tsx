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
import {isAndroid, isIOS} from '#/platform/detection'
import {useDialogStateControlContext} from '#/state/dialogs'
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
import {atoms as a, select, useTheme} from '#/alf'
import {setSystemUITheme} from '#/alf/util/systemUI'
import {InAppBrowserConsentDialog} from '#/components/dialogs/InAppBrowserConsent'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {SigninDialog} from '#/components/dialogs/Signin'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {RoutesContainer, TabsNavigator} from '#/Navigation'
import {BottomSheetOutlet} from '../../../modules/bottom-sheet'
import {updateActiveViewAsync} from '../../../modules/expo-bluesky-swiss-army/src/VisibilityView'
import {Composer} from './Composer'
import {DrawerContent} from './Drawer'

function ShellInner() {
  const t = useTheme()
  const isDrawerOpen = useIsDrawerOpen()
  const isDrawerSwipeDisabled = useIsDrawerSwipeDisabled()
  const setIsDrawerOpen = useSetDrawerOpen()
  const winDim = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const renderDrawerContent = useCallback(() => <DrawerContent />, [])
  const onOpenDrawer = useCallback(
    () => setIsDrawerOpen(true),
    [setIsDrawerOpen],
  )
  const onCloseDrawer = useCallback(
    () => setIsDrawerOpen(false),
    [setIsDrawerOpen],
  )
  const canGoBack = useNavigationState(state => !isStateAtTabRoot(state))
  const {hasSession} = useSession()
  const closeAnyActiveElement = useCloseAnyActiveElement()

  useNotificationsRegistration()
  useNotificationsHandler()

  useEffect(() => {
    if (isAndroid) {
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
    if (!isAndroid) return
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

  const swipeEnabled = !canGoBack && hasSession && !isDrawerSwipeDisabled
  const [trendingScrollGesture] = useState(() => Gesture.Native())
  return (
    <>
      <View style={[a.h_full]}>
        <ErrorBoundary
          style={{paddingTop: insets.top, paddingBottom: insets.bottom}}>
          <Drawer
            renderDrawerContent={renderDrawerContent}
            drawerStyle={{width: Math.min(400, winDim.width * 0.8)}}
            configureGestureHandler={handler => {
              handler = handler.requireExternalGestureToFail(
                trendingScrollGesture,
              )

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
            drawerType={isIOS ? 'slide' : 'front'}
            overlayStyle={{
              backgroundColor: select(t.name, {
                light: 'rgba(0, 57, 117, 0.1)',
                dark: isAndroid
                  ? 'rgba(16, 133, 254, 0.1)'
                  : 'rgba(1, 82, 168, 0.1)',
                dim: 'rgba(10, 13, 16, 0.8)',
              }),
            }}>
            <TabsNavigator />
          </Drawer>
        </ErrorBoundary>
      </View>
      <Composer winHeight={winDim.height} />
      <ModalsContainer />
      <MutedWordsDialog />
      <SigninDialog />
      <InAppBrowserConsentDialog />
      <Lightbox />
      <PortalOutlet />
      <BottomSheetOutlet />
    </>
  )
}

export const Shell: React.FC = function ShellImpl() {
  const {fullyExpandedCount} = useDialogStateControlContext()
  const t = useTheme()
  useIntentHandler()

  useEffect(() => {
    setSystemUITheme('theme', t)
  }, [t])

  return (
    <View testID="mobileShellView" style={[a.h_full, t.atoms.bg]}>
      <SystemBars
        style={{
          statusBar:
            t.name !== 'light' || (isIOS && fullyExpandedCount > 0)
              ? 'light'
              : 'dark',
          navigationBar: t.name !== 'light' ? 'light' : 'dark',
        }}
      />
      <RoutesContainer>
        <ShellInner />
      </RoutesContainer>
    </View>
  )
}
