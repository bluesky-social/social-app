import React, {useEffect} from 'react'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import {useNavigationState} from '@react-navigation/native'
import {DesktopLeftNav} from './desktop/LeftNav'
import {DesktopRightNav} from './desktop/RightNav'
import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {Lightbox} from '../com/lightbox/Lightbox'
import {ModalsContainer} from '../com/modals/Modal'
import {Composer} from './Composer.web'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {s, colors} from 'lib/styles'
import {RoutesContainer, FlatNavigator} from '../../Navigation'
import {DrawerContent} from './Drawer'
import {useWebMediaQueries} from '../../lib/hooks/useWebMediaQueries'
import {BottomBarWeb} from './bottom-bar/BottomBarWeb'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {useAuxClick} from 'lib/hooks/useAuxClick'
import {t} from '@lingui/macro'
import {
  useIsDrawerOpen,
  useSetDrawerOpen,
  useOnboardingState,
} from '#/state/shell'
import {useCloseAllActiveElements} from '#/state/util'
import {ROUTES_CONFIG, RouteName} from '#/routes'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {IS_PROD} from '#/env'
import {LoggedOut} from '#/view/com/auth/LoggedOut'
import {useSession} from '#/state/session'

function ShellInner() {
  const {hasSession} = useSession()
  const isDrawerOpen = useIsDrawerOpen()
  const setDrawerOpen = useSetDrawerOpen()
  const onboardingState = useOnboardingState()
  const {isDesktop, isMobile} = useWebMediaQueries()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {showLoggedOut} = useLoggedOutView()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const navigator = useNavigation<NavigationProp>()
  const navigationState = useNavigationState(state => state)

  const {routes} = navigationState
  const currentRouteName = routes.slice(-1)[0]?.name
  const currentRouteConfig = ROUTES_CONFIG[currentRouteName as RouteName]
  const currentRouteIsPublic = currentRouteConfig?.isPublic

  const showBottomBar = isMobile && !onboardingState.isActive
  const showSideNavs = !isMobile && !onboardingState.isActive

  useAuxClick()

  useEffect(() => {
    navigator.addListener('state', () => {
      closeAllActiveElements()
    })
  }, [navigator, closeAllActiveElements])

  return (
    <View style={[s.hContentRegion, {overflow: 'hidden'}]}>
      <View style={s.hContentRegion}>
        <ErrorBoundary>
          <FlatNavigator />
        </ErrorBoundary>
      </View>

      {showSideNavs && (
        <>
          <DesktopLeftNav />
          <DesktopRightNav />
        </>
      )}

      <Composer winHeight={0} />

      {showBottomBar && <BottomBarWeb />}

      <ModalsContainer />

      <Lightbox />

      {!isDesktop && isDrawerOpen && (
        <TouchableOpacity
          onPress={() => setDrawerOpen(false)}
          style={styles.drawerMask}
          accessibilityLabel={t`Close navigation footer`}
          accessibilityHint="Closes bottom navigation bar">
          <View style={styles.drawerContainer}>
            <DrawerContent />
          </View>
        </TouchableOpacity>
      )}

      {!hasSession && (
        <>
          {!currentRouteIsPublic || IS_PROD ? (
            <LoggedOut />
          ) : showLoggedOut ? (
            <LoggedOut onDismiss={() => setShowLoggedOut(false)} />
          ) : null}
        </>
      )}
    </View>
  )
}

export const Shell: React.FC = function ShellImpl() {
  const pageBg = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  return (
    <View style={[s.hContentRegion, pageBg]}>
      <RoutesContainer>
        <ShellInner />
      </RoutesContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  bgLight: {
    backgroundColor: colors.white,
  },
  bgDark: {
    backgroundColor: colors.black, // TODO
  },
  drawerMask: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerContainer: {
    display: 'flex',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
  },
})
