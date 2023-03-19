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
        quote={store.shell.composerOpts?.quote}
        onPost={store.shell.composerOpts?.onPost}
      />
      <ModalsContainer />
      <Lightbox />
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
})
