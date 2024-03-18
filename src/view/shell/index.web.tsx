import React, {useEffect} from 'react'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import {useNavigation} from '@react-navigation/native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {Lightbox} from '../com/lightbox/Lightbox'
import {ModalsContainer} from '../com/modals/Modal'
import {Composer} from './Composer.web'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {s, colors} from 'lib/styles'
import {RoutesContainer, FlatNavigator} from '../../Navigation'
import {DrawerContent} from './Drawer'
import {useWebMediaQueries} from '../../lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {useIsDrawerOpen, useSetDrawerOpen} from '#/state/shell'
import {useCloseAllActiveElements} from '#/state/util'
import {useWebBodyScrollLock} from '#/lib/hooks/useWebBodyScrollLock'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'

function ShellInner() {
  const isDrawerOpen = useIsDrawerOpen()
  const setDrawerOpen = useSetDrawerOpen()
  const {isDesktop} = useWebMediaQueries()
  const navigator = useNavigation<NavigationProp>()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {_} = useLingui()

  useWebBodyScrollLock(isDrawerOpen)

  useEffect(() => {
    const unsubscribe = navigator.addListener('state', () => {
      closeAllActiveElements()
    })
    return unsubscribe
  }, [navigator, closeAllActiveElements])

  return (
    <>
      <ErrorBoundary>
        <FlatNavigator />
      </ErrorBoundary>
      <Composer winHeight={0} />
      <ModalsContainer />
      <MutedWordsDialog />
      <Lightbox />
      <PortalOutlet />

      {!isDesktop && isDrawerOpen && (
        <TouchableOpacity
          onPress={() => setDrawerOpen(false)}
          style={styles.drawerMask}
          accessibilityLabel={_(msg`Close navigation footer`)}
          accessibilityHint={_(msg`Closes bottom navigation bar`)}>
          <View style={styles.drawerContainer}>
            <DrawerContent />
          </View>
        </TouchableOpacity>
      )}
    </>
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
    // @ts-ignore web only
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerContainer: {
    display: 'flex',
    // @ts-ignore web only
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100%',
  },
})
