import React from 'react'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {useStores} from 'state/index'
import {NavigationModel} from 'state/models/navigation'
import {match, MatchResult} from '../../routes'
import {DesktopHeader} from './DesktopHeader'
import {DesktopRightColumn} from './DesktopRightColumn'
import {Onboard} from '../../screens/Onboard'
import {Login} from '../../screens/Login'
import {ErrorBoundary} from '../../com/util/ErrorBoundary'
import {Lightbox} from '../../com/lightbox/Lightbox'
import {ModalsContainer} from '../../com/modals/Modal'
import {Text} from 'view/com/util/text/Text'
import {Composer} from './Composer'
import {usePalette} from 'lib/hooks/usePalette'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {s, colors} from 'lib/styles'
import {isMobileWeb} from 'platform/detection'

export const WebShell: React.FC = observer(() => {
  const pageBg = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  const store = useStores()
  const screenRenderDesc = constructScreenRenderDesc(store.nav)

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
  if (store.onboard.isOnboarding) {
    return (
      <View style={styles.outerContainer}>
        <ErrorBoundary>
          <Onboard />
        </ErrorBoundary>
      </View>
    )
  }

  return (
    <View style={[styles.outerContainer, pageBg]}>
      <DesktopHeader />
      {screenRenderDesc.screens.map(({Com, navIdx, params, key, current}) => (
        <View
          key={key}
          style={[s.h100pct, current ? styles.visible : styles.hidden]}>
          <ErrorBoundary>
            <Com params={params} navIdx={navIdx} visible={current} />
          </ErrorBoundary>
        </View>
      ))}
      <DesktopRightColumn />
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
    </View>
  )
})

/**
 * This method produces the information needed by the shell to
 * render the current screens with screen-caching behaviors.
 */
type ScreenRenderDesc = MatchResult & {
  key: string
  navIdx: string
  current: boolean
  previous: boolean
  isNewTab: boolean
}
function constructScreenRenderDesc(nav: NavigationModel): {
  icon: IconProp
  hasNewTab: boolean
  screens: ScreenRenderDesc[]
} {
  let hasNewTab = false
  let icon: IconProp = 'magnifying-glass'
  let screens: ScreenRenderDesc[] = []
  for (const tab of nav.tabs) {
    const tabScreens = [
      ...tab.getBackList(5),
      Object.assign({}, tab.current, {index: tab.index}),
    ]
    const parsedTabScreens = tabScreens.map(screen => {
      const isCurrent = nav.isCurrentScreen(tab.id, screen.index)
      const isPrevious = nav.isCurrentScreen(tab.id, screen.index + 1)
      const matchRes = match(screen.url)
      if (isCurrent) {
        icon = matchRes.icon
      }
      hasNewTab = hasNewTab || tab.isNewTab
      return Object.assign(matchRes, {
        key: `t${tab.id}-s${screen.index}`,
        navIdx: `${tab.id}-${screen.id}`,
        current: isCurrent,
        previous: isPrevious,
        isNewTab: tab.isNewTab,
      }) as ScreenRenderDesc
    })
    screens = screens.concat(parsedTabScreens)
  }
  return {
    icon,
    hasNewTab,
    screens,
  }
}

function NoMobileWeb() {
  const pal = usePalette('default')
  return (
    <View style={[pal.view, styles.noMobileWeb]}>
      <Text type="title-2xl" style={{paddingBottom: 20}}>
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
