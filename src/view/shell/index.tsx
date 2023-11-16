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

function ShellInner() {
  const isDrawerOpen = useIsDrawerOpen()
  const isDrawerSwipeDisabled = useIsDrawerSwipeDisabled()
  const setIsDrawerOpen = useSetDrawerOpen()
  useOTAUpdate() // this hook polls for OTA updates every few seconds
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
  const {hasSession} = useSession()
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
