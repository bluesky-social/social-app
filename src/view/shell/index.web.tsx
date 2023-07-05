import {FlatNavigator, RoutesContainer} from '../../Navigation'
import React, {useEffect} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {colors, s} from 'lib/styles'

import {BottomBarWeb} from './bottom-bar/BottomBarWeb'
import {Composer} from './Composer.web'
import {DesktopLeftNav} from './desktop/LeftNav'
import {DrawerContent} from './Drawer'
import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {Lightbox} from '../com/lightbox/Lightbox'
import {ModalsContainer} from '../com/modals/Modal'
import {NavigationProp} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {useNavigation} from '@react-navigation/native'
import {useStores} from 'state/index'
import {useWebMediaQueries} from '../../lib/hooks/useWebMediaQueries'

const ShellInner = observer(() => {
  const store = useStores()
  const {isDesktop} = useWebMediaQueries()

  const navigator = useNavigation<NavigationProp>()

  useEffect(() => {
    navigator.addListener('state', () => {
      store.shell.closeAnyActiveElement()
    })
  }, [navigator, store.shell])

  return (
    <>
      <View style={s.hContentRegion}>
        <ErrorBoundary>
          <FlatNavigator />
        </ErrorBoundary>
      </View>
      {isDesktop && (
        <>
          <DesktopLeftNav />
          {/* <DesktopRightNav /> */}
        </>
      )}

      <Composer
        active={store.shell.isComposerActive && !store.session.isDefaultSession}
        onClose={() => store.shell.closeComposer()}
        winHeight={0}
        replyTo={store.shell.composerOpts?.replyTo}
        quote={store.shell.composerOpts?.quote}
        onPost={store.shell.composerOpts?.onPost}
      />
      {!isDesktop && !store.session.isDefaultSession && <BottomBarWeb />}
      <ModalsContainer />
      <Lightbox />

      {!isDesktop && store.shell.isDrawerOpen && (
        <TouchableOpacity
          onPress={() => store.shell.closeDrawer()}
          style={styles.drawerMask}
          accessibilityLabel="Close navigation footer"
          accessibilityHint="Closes bottom navigation bar">
          <View style={styles.drawerContainer}>
            <DrawerContent />
          </View>
        </TouchableOpacity>
      )}
    </>
  )
})

export const Shell: React.FC = observer(() => {
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
