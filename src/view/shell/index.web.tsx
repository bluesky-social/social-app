import React from 'react'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet} from 'react-native'
import {useStores} from 'state/index'
import {DesktopHeader} from './desktop/Header'
import {Login} from '../screens/Login'
import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {Lightbox} from '../com/lightbox/Lightbox'
import {ModalsContainer} from '../com/modals/Modal'
import {Text} from 'view/com/util/text/Text'
import {Composer} from './Composer.web'
import {usePalette} from 'lib/hooks/usePalette'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {s, colors} from 'lib/styles'
import {isMobileWeb} from 'platform/detection'
import {RoutesContainer, FlatNavigator} from '../../Routes'

const ShellInner = observer(() => {
  const store = useStores()

  return (
    <>
      <DesktopHeader />
      <View style={[s.hContentRegion]}>
        <ErrorBoundary>
          <FlatNavigator />
        </ErrorBoundary>
      </View>
      <Composer
        active={store.shell.isComposerActive}
        onClose={() => store.shell.closeComposer()}
        winHeight={0}
        replyTo={store.shell.composerOpts?.replyTo}
        imagesOpen={store.shell.composerOpts?.imagesOpen}
        onPost={store.shell.composerOpts?.onPost}
      />
      <ModalsContainer />
      <Lightbox />
    </>
  )
})

export const Shell: React.FC = observer(() => {
  const pageBg = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  const store = useStores()

  if (isMobileWeb) {
    return <NoMobileWeb />
  }

  if (!store.session.hasSession) {
    return (
      <View style={styles.outerContainer}>
        <Login />
        <ModalsContainer />
      </View>
    )
  }

  return (
    <View style={[styles.outerContainer, pageBg]}>
      <RoutesContainer>
        <ShellInner />
      </RoutesContainer>
    </View>
  )
})

function NoMobileWeb() {
  const pal = usePalette('default')
  return (
    <View style={[pal.view, styles.noMobileWeb]}>
      <Text type="title-2xl" style={s.pb20}>
        We're so sorry!
      </Text>
      <Text type="lg">
        This app is not available for mobile Web yet. Please open it on your
        desktop or download the iOS app.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
  bgLight: {
    backgroundColor: colors.white,
  },
  bgDark: {
    backgroundColor: colors.black, // TODO
  },
  visible: {
    display: 'flex',
  },
  hidden: {
    display: 'none',
  },
  noMobileWeb: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
})
