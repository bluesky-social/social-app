import React from 'react'
import {BackHandler, StyleSheet, useWindowDimensions, View} from 'react-native'
import {Drawer} from 'react-native-drawer-layout'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as NavigationBar from 'expo-navigation-bar'
import {StatusBar} from 'expo-status-bar'
import {useNavigation, useNavigationState} from '@react-navigation/native'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {useIntentHandler} from '#/lib/hooks/useIntentHandler'
import {useNotificationsHandler} from '#/lib/hooks/useNotificationHandler'
import {usePalette} from '#/lib/hooks/usePalette'
import {useNotificationsRegistration} from '#/lib/notifications/notifications'
import {isStateAtTabRoot} from '#/lib/routes/helpers'
import {useTheme} from '#/lib/ThemeContext'
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
import {atoms as a, select, useTheme as useNewTheme} from '#/alf'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {SigninDialog} from '#/components/dialogs/Signin'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {BottomSheetOutlet} from '../../../modules/bottom-sheet'
import {updateActiveViewAsync} from '../../../modules/expo-bluesky-swiss-army/src/VisibilityView'
import {RoutesContainer, TabsNavigator} from '../../Navigation'
import {Composer} from './Composer'
import {DrawerContent} from './Drawer'

function ShellInner() {
  const t = useNewTheme()
  const isDrawerOpen = useIsDrawerOpen()
  const isDrawerSwipeDisabled = useIsDrawerSwipeDisabled()
  const setIsDrawerOpen = useSetDrawerOpen()
  const winDim = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const renderDrawerContent = React.useCallback(() => <DrawerContent />, [])
  const onOpenDrawer = React.useCallback(
    () => setIsDrawerOpen(true),
    [setIsDrawerOpen],
  )
  const onCloseDrawer = React.useCallback(
    () => setIsDrawerOpen(false),
    [setIsDrawerOpen],
  )
  const canGoBack = useNavigationState(state => !isStateAtTabRoot(state))
  const {hasSession} = useSession()
  const closeAnyActiveElement = useCloseAnyActiveElement()

  useNotificationsRegistration()
  useNotificationsHandler()

  React.useEffect(() => {
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
  React.useEffect(() => {
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

  return (
    <>
      <Animated.View style={[a.h_full]}>
        <ErrorBoundary
          style={{paddingTop: insets.top, paddingBottom: insets.bottom}}>
          <Drawer
            renderDrawerContent={renderDrawerContent}
            drawerStyle={{width: Math.min(400, winDim.width * 0.8)}}
            open={isDrawerOpen}
            onOpen={onOpenDrawer}
            onClose={onCloseDrawer}
            swipeEdgeWidth={winDim.width / 2}
            drawerType={isIOS ? 'slide' : 'front'}
            swipeEnabled={!canGoBack && hasSession && !isDrawerSwipeDisabled}
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
      </Animated.View>
      <Composer winHeight={winDim.height} />
      <ModalsContainer />
      <MutedWordsDialog />
      <SigninDialog />
      <Lightbox />
      <PortalOutlet />
      <BottomSheetOutlet />
    </>
  )
}

export const Shell: React.FC = function ShellImpl() {
  const {fullyExpandedCount} = useDialogStateControlContext()
  const pal = usePalette('default')
  const theme = useTheme()
  useIntentHandler()

  React.useEffect(() => {
    if (isAndroid) {
      NavigationBar.setBackgroundColorAsync(theme.palette.default.background)
      NavigationBar.setBorderColorAsync(theme.palette.default.background)
      NavigationBar.setButtonStyleAsync(
        theme.colorScheme === 'dark' ? 'light' : 'dark',
      )
    }
  }, [theme])
  return (
    <View testID="mobileShellView" style={[styles.outerContainer, pal.view]}>
      <StatusBar
        style={
          theme.colorScheme === 'dark' || (isIOS && fullyExpandedCount > 0)
            ? 'light'
            : 'dark'
        }
        animated
      />
      <RoutesContainer>
        <ShellInner />
      </RoutesContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
})
