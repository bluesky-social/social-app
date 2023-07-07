import React from 'react'
import {observer} from 'mobx-react-lite'
import {StatusBar} from 'expo-status-bar'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Drawer} from 'react-native-drawer-layout'
import {useNavigationState} from '@react-navigation/native'
import {useStores} from 'state/index'
import {ModalsContainer} from 'view/com/modals/Modal'
import {Lightbox} from 'view/com/lightbox/Lightbox'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {DrawerContent} from './Drawer'
import {Composer} from './Composer'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import * as backHandler from 'lib/routes/back-handler'
import {RoutesContainer, TabsNavigator} from '../../Navigation'
import {isStateAtTabRoot} from 'lib/routes/helpers'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useOTAUpdate} from 'lib/hooks/useOTAUpdate'

const ShellInner = observer(() => {
  const store = useStores()
  useOTAUpdate() // this hook polls for OTA updates every few seconds
  const winDim = useWindowDimensions()
  const safeAreaInsets = useSafeAreaInsets()
  const containerPadding = React.useMemo(
    () => ({height: '100%', paddingTop: safeAreaInsets.top}),
    [safeAreaInsets],
  )
  const renderDrawerContent = React.useCallback(() => <DrawerContent />, [])
  const onOpenDrawer = React.useCallback(
    () => store.shell.openDrawer(),
    [store],
  )
  const onCloseDrawer = React.useCallback(
    () => store.shell.closeDrawer(),
    [store],
  )
  const canGoBack = useNavigationState(state => !isStateAtTabRoot(state))
  React.useEffect(() => {
    backHandler.init(store)
  }, [store])

  return (
    <>
      <View style={containerPadding}>
        <ErrorBoundary>
          <Drawer
            renderDrawerContent={renderDrawerContent}
            open={store.shell.isDrawerOpen}
            onOpen={onOpenDrawer}
            onClose={onCloseDrawer}
            swipeEdgeWidth={winDim.width / 2}
            swipeEnabled={
              !canGoBack &&
              store.session.hasSession &&
              !store.shell.isDrawerSwipeDisabled
            }>
            <TabsNavigator />
          </Drawer>
        </ErrorBoundary>
      </View>
      <Composer
        active={store.shell.isComposerActive}
        onClose={() => store.shell.closeComposer()}
        winHeight={winDim.height}
        replyTo={store.shell.composerOpts?.replyTo}
        onPost={store.shell.composerOpts?.onPost}
        quote={store.shell.composerOpts?.quote}
      />
      <ModalsContainer />
      <Lightbox />
    </>
  )
})

export const Shell: React.FC = observer(() => {
  const pal = usePalette('default')
  const theme = useTheme()
  return (
    <SafeAreaProvider style={pal.view}>
      <View testID="mobileShellView" style={[styles.outerContainer, pal.view]}>
        <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
        <RoutesContainer>
          <ShellInner />
        </RoutesContainer>
      </View>
    </SafeAreaProvider>
  )
})

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
})
