import React from 'react'
import {StatusBar} from 'expo-status-bar'
import {
  DimensionValue,
  StyleSheet,
  useWindowDimensions,
  View,
  BackHandler,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Drawer} from 'react-native-drawer-layout'
import {useNavigationState} from '@react-navigation/native'
import {ModalsContainer} from 'view/com/modals/Modal'
import {Lightbox} from 'view/com/lightbox/Lightbox'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {DrawerContent} from './Drawer'
import {Composer} from './Composer'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {RoutesContainer, TabsNavigator} from '../../Navigation'
import {isStateAtTabRoot} from 'lib/routes/helpers'
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context'
import {useOTAUpdate} from 'lib/hooks/useOTAUpdate'
import {
  useIsDrawerOpen,
  useSetDrawerOpen,
  useIsDrawerSwipeDisabled,
} from '#/state/shell'
import {isAndroid} from 'platform/detection'
import {useSession} from '#/state/session'
import {useCloseAnyActiveElement} from '#/state/util'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {IS_PROD} from '#/env'
import {LoggedOut} from '#/view/com/auth/LoggedOut'

function ShellInner() {
  useOTAUpdate() // this hook polls for OTA updates every few seconds

  const {hasSession} = useSession()
  const isDrawerOpen = useIsDrawerOpen()
  const isDrawerSwipeDisabled = useIsDrawerSwipeDisabled()
  const setIsDrawerOpen = useSetDrawerOpen()
  const winDim = useWindowDimensions()
  const safeAreaInsets = useSafeAreaInsets()
  const closeAnyActiveElement = useCloseAnyActiveElement()
  const {showLoggedOut} = useLoggedOutView()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const navigationState = useNavigationState(state => state)
  const canGoBack = !isStateAtTabRoot(navigationState)
  // on mobile we default to public
  const currentRouteIsPublic = true

  const containerPadding = React.useMemo(
    () => ({height: '100%' as DimensionValue, paddingTop: safeAreaInsets.top}),
    [safeAreaInsets],
  )
  const renderDrawerContent = React.useCallback(() => <DrawerContent />, [])
  const onOpenDrawer = React.useCallback(
    () => setIsDrawerOpen(true),
    [setIsDrawerOpen],
  )
  const onCloseDrawer = React.useCallback(
    () => setIsDrawerOpen(false),
    [setIsDrawerOpen],
  )

  React.useEffect(() => {
    let listener = {remove() {}}
    if (isAndroid) {
      listener = BackHandler.addEventListener('hardwareBackPress', () => {
        return closeAnyActiveElement()
      })
    }
    return () => {
      listener.remove()
    }
  }, [closeAnyActiveElement])

  return (
    <>
      <View style={containerPadding}>
        <ErrorBoundary>
          <Drawer
            renderDrawerContent={renderDrawerContent}
            open={isDrawerOpen}
            onOpen={onOpenDrawer}
            onClose={onCloseDrawer}
            swipeEdgeWidth={winDim.width / 2}
            swipeEnabled={!canGoBack && hasSession && !isDrawerSwipeDisabled}>
            <TabsNavigator />
          </Drawer>
        </ErrorBoundary>
      </View>
      <Composer winHeight={winDim.height} />
      <ModalsContainer />
      <Lightbox />

      {!hasSession && (
        <>
          {!currentRouteIsPublic || IS_PROD ? (
            <LoggedOut />
          ) : showLoggedOut ? (
            <LoggedOut onDismiss={() => setShowLoggedOut(false)} />
          ) : null}
        </>
      )}
    </>
  )
}

export const Shell: React.FC = function ShellImpl() {
  const pal = usePalette('default')
  const theme = useTheme()
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={pal.view}>
      <View testID="mobileShellView" style={[styles.outerContainer, pal.view]}>
        <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
        <RoutesContainer>
          <ShellInner />
        </RoutesContainer>
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
})
