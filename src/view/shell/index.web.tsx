import React, {useEffect} from 'react'
import {StyleSheet, View} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {useCloseAllActiveElements} from '#/state/util'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {NavigationProp} from 'lib/routes/types'
import {colors, s} from 'lib/styles'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {SigninDialog} from '#/components/dialogs/Signin'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {FlatNavigator, RoutesContainer} from '../../Navigation'
import {Lightbox} from '../com/lightbox/Lightbox'
import {ModalsContainer} from '../com/modals/Modal'
import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {Composer} from './Composer.web'

function ShellInner() {
  const navigator = useNavigation<NavigationProp>()
  const closeAllActiveElements = useCloseAllActiveElements()

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
      <SigninDialog />
      <Lightbox />
      <PortalOutlet />
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
})
