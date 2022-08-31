import React, {useRef} from 'react'
import {observer} from 'mobx-react-lite'
import {
  GestureResponderEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {ScreenContainer, Screen} from 'react-native-screens'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {useStores} from '../../../state'
import {NavigationModel} from '../../../state/models/navigation'
import {match, MatchResult} from '../../routes'
import {TabsSelectorModal} from './tabs-selector'
import {createBackMenu, createForwardMenu} from './history-menu'
import {colors} from '../../lib/styles'

const Location = ({icon, title}: {icon: IconProp; title?: string}) => {
  return (
    <TouchableOpacity style={styles.location}>
      {title ? (
        <FontAwesomeIcon size={16} style={styles.locationIcon} icon={icon} />
      ) : (
        <FontAwesomeIcon
          size={16}
          style={styles.locationIconLight}
          icon="magnifying-glass"
        />
      )}
      <Text style={title ? styles.locationText : styles.locationTextLight}>
        {title || 'Search'}
      </Text>
    </TouchableOpacity>
  )
}

const Btn = ({
  icon,
  inactive,
  onPress,
  onLongPress,
}: {
  icon: IconProp
  inactive?: boolean
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}) => {
  if (inactive) {
    return (
      <View style={styles.ctrl}>
        <FontAwesomeIcon
          size={18}
          style={[styles.ctrlIcon, styles.inactive]}
          icon={icon}
        />
      </View>
    )
  }
  return (
    <TouchableOpacity
      style={styles.ctrl}
      onPress={onPress}
      onLongPress={onLongPress}>
      <FontAwesomeIcon size={18} style={styles.ctrlIcon} icon={icon} />
    </TouchableOpacity>
  )
}

export const MobileShell: React.FC = observer(() => {
  const stores = useStores()
  const tabSelectorRef = useRef<{open: () => void}>()
  const screenRenderDesc = constructScreenRenderDesc(stores.nav)

  const onPressBack = () => stores.nav.tab.goBack()
  const onPressForward = () => stores.nav.tab.goForward()
  const onPressHome = () => stores.nav.navigate('/')
  const onPressNotifications = () => stores.nav.navigate('/notifications')
  const onPressTabs = () => tabSelectorRef.current?.open()

  const onLongPressBack = () => createBackMenu(stores.nav.tab)
  const onLongPressForward = () => createForwardMenu(stores.nav.tab)

  const onNewTab = () => stores.nav.newTab('/')
  const onChangeTab = (tabIndex: number) => stores.nav.setActiveTab(tabIndex)
  const onCloseTab = (tabIndex: number) => stores.nav.closeTab(tabIndex)

  return (
    <View style={styles.outerContainer}>
      <View style={styles.topBar}>
        <Location
          icon={screenRenderDesc.icon}
          title={stores.nav.tab.current.title}
        />
      </View>
      <SafeAreaView style={styles.innerContainer}>
        <ScreenContainer>
          {screenRenderDesc.screens.map(({Com, params, key, activityState}) => (
            <Screen
              key={key}
              style={styles.screen}
              activityState={activityState}>
              <Com params={params} />
            </Screen>
          ))}
        </ScreenContainer>
      </SafeAreaView>
      <View style={styles.bottomBar}>
        <Btn
          icon="angle-left"
          inactive={!stores.nav.tab.canGoBack}
          onPress={onPressBack}
          onLongPress={onLongPressBack}
        />
        <Btn
          icon="angle-right"
          inactive={!stores.nav.tab.canGoForward}
          onPress={onPressForward}
          onLongPress={onLongPressForward}
        />
        <Btn icon="house" onPress={onPressHome} />
        <Btn icon={['far', 'bell']} onPress={onPressNotifications} />
        <Btn icon={['far', 'clone']} onPress={onPressTabs} />
      </View>
      <TabsSelectorModal
        ref={tabSelectorRef}
        tabs={stores.nav.tabs}
        currentTabIndex={stores.nav.tabIndex}
        onNewTab={onNewTab}
        onChangeTab={onChangeTab}
        onCloseTab={onCloseTab}
      />
    </View>
  )
})

/**
 * This method produces the information needed by the shell to
 * render the current screens with screen-caching behaviors.
 */
type ScreenRenderDesc = MatchResult & {key: string; activityState: 0 | 1 | 2}
function constructScreenRenderDesc(nav: NavigationModel): {
  icon: IconProp
  screens: ScreenRenderDesc[]
} {
  let icon: IconProp = 'magnifying-glass'
  let screens: ScreenRenderDesc[] = []
  for (const tab of nav.tabs) {
    const tabScreens = [
      ...tab.getBackList(5),
      Object.assign({}, tab.current, {index: tab.index}),
    ]
    const parsedTabScreens = tabScreens.map(screen => {
      const isCurrent = nav.isCurrentScreen(tab.id, screen.index)
      const matchRes = match(screen.url)
      if (isCurrent) {
        icon = matchRes.icon
      }
      return Object.assign(matchRes, {
        key: `t${tab.id}-s${screen.index}`,
        activityState: isCurrent ? 2 : 0,
      })
    })
    screens = screens.concat(parsedTabScreens)
  }
  return {
    icon,
    screens,
  }
}

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
  innerContainer: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.gray1,
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 40,
    paddingBottom: 5,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 4,
    paddingLeft: 10,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#F8F3F3',
  },
  locationIcon: {
    color: colors.pink3,
    marginRight: 8,
  },
  locationIconLight: {
    color: colors.gray3,
    marginRight: 8,
  },
  locationText: {
    color: colors.black,
  },
  locationTextLight: {
    color: colors.gray4,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    paddingLeft: 5,
    paddingRight: 15,
    paddingBottom: 20,
  },
  ctrl: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 15,
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  inactive: {
    color: colors.gray3,
  },
})
