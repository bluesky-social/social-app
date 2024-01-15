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
  useIsDrawerOpen,
  useSetDrawerOpen,
  useIsDrawerSwipeDisabled,
} from '#/state/shell'
import {isAndroid} from 'platform/detection'
import {useSession} from '#/state/session'
import {useCloseAnyActiveElement} from '#/state/util'
import * as notifications from 'lib/notifications/notifications'
import {Outlet as PortalOutlet} from '#/components/Portal'

function ShellInner() {
  const isDrawerOpen = useIsDrawerOpen()
  const isDrawerSwipeDisabled = useIsDrawerSwipeDisabled()
  const setIsDrawerOpen = useSetDrawerOpen()
  const winDim = useWindowDimensions()
  const safeAreaInsets = useSafeAreaInsets()
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
  const canGoBack = useNavigationState(state => !isStateAtTabRoot(state))
  const {hasSession, currentAccount} = useSession()
  const closeAnyActiveElement = useCloseAnyActiveElement()

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

  React.useEffect(() => {
    if (currentAccount) {
      notifications.requestPermissionsAndRegisterToken(currentAccount)
    }
  }, [currentAccount])

  React.useEffect(() => {
    if (currentAccount) {
      const unsub = notifications.registerTokenChangeHandler(currentAccount)
      return unsub
    }
  }, [currentAccount])

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
      <PortalOutlet />
      <Lightbox />
    </>
  )
}

export const Shell: React.FC = function ShellImpl() {
  const pal = usePalette('default')
  const theme = useTheme()
  return (
    <View testID="mobileShellView" style={[styles.outerContainer, pal.view]}>
      <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
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
