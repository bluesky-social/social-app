import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import {useStores} from 'state/index'
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
import {useIsDrawerOpen, useSetDrawerOpen} from '#/state/shell'

const ShellInner = observer(function ShellInnerImpl() {
  const store = useStores()
  const isDrawerOpen = useIsDrawerOpen()
  const setDrawerOpen = useSetDrawerOpen()
  const {isDesktop, isMobile} = useWebMediaQueries()
  const navigator = useNavigation<NavigationProp>()
  useAuxClick()

  useEffect(() => {
    navigator.addListener('state', () => {
      setDrawerOpen(false)
      store.shell.closeAnyActiveElement()
    })
  }, [navigator, store.shell, setDrawerOpen])

  const showBottomBar = isMobile && !store.onboarding.isActive
  const showSideNavs =
    !isMobile && store.session.hasSession && !store.onboarding.isActive
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
      <Composer
        active={store.shell.isComposerActive}
        winHeight={0}
        replyTo={store.shell.composerOpts?.replyTo}
        quote={store.shell.composerOpts?.quote}
        onPost={store.shell.composerOpts?.onPost}
        mention={store.shell.composerOpts?.mention}
      />
      {showBottomBar && <BottomBarWeb />}
      <ModalsContainer />
      <Lightbox />
      {!isDesktop && isDrawerOpen && (
        <TouchableOpacity
          onPress={() => setDrawerOpen(false)}
          style={styles.drawerMask}
          accessibilityLabel="Close navigation footer"
          accessibilityHint="Closes bottom navigation bar">
          <View style={styles.drawerContainer}>
            <DrawerContent />
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
})

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
