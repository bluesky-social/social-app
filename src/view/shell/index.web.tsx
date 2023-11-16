import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
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
import {useSession} from '#/state/session'
import {useCloseAllActiveElements} from '#/state/util'

function ShellInner() {
  const isDrawerOpen = useIsDrawerOpen()
  const setDrawerOpen = useSetDrawerOpen()
  const onboardingState = useOnboardingState()
  const {isDesktop, isMobile} = useWebMediaQueries()
  const navigator = useNavigation<NavigationProp>()
  const {hasSession} = useSession()
  const closeAllActiveElements = useCloseAllActiveElements()

  useAuxClick()

  useEffect(() => {
    navigator.addListener('state', () => {
      closeAllActiveElements()
    })
  }, [navigator, closeAllActiveElements])

  const showBottomBar = isMobile && !onboardingState.isActive
  const showSideNavs = !isMobile && hasSession && !onboardingState.isActive
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
    </View>
  )
}

export const Shell: React.FC = observer(function ShellImpl() {
  const pageBg = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  return (
    <View style={[s.hContentRegion, pageBg]}>
      <RoutesContainer>
        <ShellInner />
      </RoutesContainer>
    </View>
  )
})

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
