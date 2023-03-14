import React from 'react'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet} from 'react-native'
import {useStores} from 'state/index'
import {DesktopLeftNav} from './desktop/LeftNav'
import {DesktopRightNav} from './desktop/RightNav'
import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {Lightbox} from '../com/lightbox/Lightbox'
import {ModalsContainer} from '../com/modals/Modal'
import {Text} from 'view/com/util/text/Text'
import {Composer} from './Composer.web'
import {usePalette} from 'lib/hooks/usePalette'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {s, colors} from 'lib/styles'
import {isMobileWeb} from 'platform/detection'
import {RoutesContainer, FlatNavigator} from '../../Navigation'

const ShellInner = observer(() => {
  const store = useStores()

  return (
    <>
      <View style={s.hContentRegion}>
        <ErrorBoundary>
          <FlatNavigator />
        </ErrorBoundary>
      </View>
      <DesktopLeftNav />
      <DesktopRightNav />
      <View style={[styles.viewBorder, styles.viewBorderLeft]} />
      <View style={[styles.viewBorder, styles.viewBorderRight]} />
      <Composer
        active={store.shell.isComposerActive}
        onClose={() => store.shell.closeComposer()}
        winHeight={0}
        replyTo={store.shell.composerOpts?.replyTo}
        onPost={store.shell.composerOpts?.onPost}
      />
      <ModalsContainer />
      <Lightbox />
    </>
  )
})

export const Shell: React.FC = observer(() => {
  const pageBg = useColorSchemeStyle(styles.bgLight, styles.bgDark)

  if (isMobileWeb) {
    return <NoMobileWeb />
  }
  return (
    <View style={[s.hContentRegion, pageBg]}>
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
  bgLight: {
    backgroundColor: colors.white,
  },
  bgDark: {
    backgroundColor: colors.black, // TODO
  },
  viewBorder: {
    position: 'absolute',
    width: 1,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: colors.gray2,
  },
  viewBorderLeft: {
    left: 'calc(50vw - 300px)',
  },
  viewBorderRight: {
    left: 'calc(50vw + 300px)',
  },
  noMobileWeb: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
})
