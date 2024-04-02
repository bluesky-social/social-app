import React from 'react'
import {
  BackHandler,
  DimensionValue,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import {Drawer} from 'react-native-drawer-layout'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {StatusBar} from 'expo-status-bar'
import {useNavigationState} from '@react-navigation/native'

import {useSession} from '#/state/session'
import {
  useIsDrawerOpen,
  useIsDrawerSwipeDisabled,
  useSetDrawerOpen,
} from '#/state/shell'
import {useCloseAnyActiveElement} from '#/state/util'
import {usePalette} from 'lib/hooks/usePalette'
import * as notifications from 'lib/notifications/notifications'
import {isStateAtTabRoot} from 'lib/routes/helpers'
import {useTheme} from 'lib/ThemeContext'
import {isAndroid} from 'platform/detection'
import {useDialogStateContext} from 'state/dialogs'
import {Lightbox} from 'view/com/lightbox/Lightbox'
import {ModalsContainer} from 'view/com/modals/Modal'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {RoutesContainer, TabsNavigator} from '../../Navigation'
import {Composer} from './Composer'
import {DrawerContent} from './Drawer'

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
  const {importantForAccessibility} = useDialogStateContext()
  // start undefined
  const currentAccountDid = React.useRef<string | undefined>(undefined)

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
    // only runs when did changes
    if (currentAccount && currentAccountDid.current !== currentAccount.did) {
      currentAccountDid.current = currentAccount.did
      notifications.requestPermissionsAndRegisterToken(currentAccount)
      const unsub = notifications.registerTokenChangeHandler(currentAccount)
      return unsub
    }
  }, [currentAccount])

  return (
    <>
      <Animated.View
        style={containerPadding}
        importantForAccessibility={importantForAccessibility}>
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
      </Animated.View>
      <Composer winHeight={winDim.height} />
      <ModalsContainer />
      <MutedWordsDialog />
      <Lightbox />
      <PortalOutlet />
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
