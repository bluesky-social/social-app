import React from 'react'
import {
  BackHandler,
  DimensionValue,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as NavigationBar from 'expo-navigation-bar'
import {StatusBar} from 'expo-status-bar'

import {useSession} from '#/state/session'
import {useCloseAnyActiveElement} from '#/state/util'
import {usePalette} from 'lib/hooks/usePalette'
import * as notifications from 'lib/notifications/notifications'
import {useTheme} from 'lib/ThemeContext'
import {isAndroid} from 'platform/detection'
import {useDialogStateContext} from 'state/dialogs'
import {Lightbox} from 'view/com/lightbox/Lightbox'
import {ModalsContainer} from 'view/com/modals/Modal'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {SigninDialog} from '#/components/dialogs/Signin'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {RoutesContainer, TabsNavigator} from '../../Navigation'
import {Composer} from './Composer'

function ShellInner() {
  const winDim = useWindowDimensions()
  const safeAreaInsets = useSafeAreaInsets()
  const containerPadding = React.useMemo(
    () => ({height: '100%' as DimensionValue, paddingTop: safeAreaInsets.top}),
    [safeAreaInsets],
  )
  const {currentAccount} = useSession()
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
          <TabsNavigator />
        </ErrorBoundary>
      </Animated.View>
      <Composer winHeight={winDim.height} />
      <ModalsContainer />
      <MutedWordsDialog />
      <SigninDialog />
      <Lightbox />
      <PortalOutlet />
    </>
  )
}

export const Shell: React.FC = function ShellImpl() {
  const pal = usePalette('default')
  const theme = useTheme()
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
