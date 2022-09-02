import React, {useState, useRef} from 'react'
import {observer} from 'mobx-react-lite'
import {
  GestureResponderEvent,
  Image,
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
import {Modal} from '../../com/modals/Modal'
import {TabsSelectorModal} from './tabs-selector'
import {LocationNavigator} from './location-navigator'
import {createBackMenu, createForwardMenu} from './history-menu'
import {createAccountsMenu} from './accounts-menu'
import {createLocationMenu} from './location-menu'
import {colors} from '../../lib/styles'
import {AVIS} from '../../lib/assets'

const locationIconNeedsNudgeUp = (icon: IconProp) => icon === 'house'

const Location = ({
  icon,
  title,
  onPress,
}: {
  icon: IconProp
  title?: string
  onPress?: (event: GestureResponderEvent) => void
}) => {
  const nudgeUp = locationIconNeedsNudgeUp(icon)
  return (
    <TouchableOpacity style={styles.location} onPress={onPress}>
      {title ? (
        <FontAwesomeIcon
          size={12}
          style={[
            styles.locationIcon,
            nudgeUp ? styles.locationIconNudgeUp : undefined,
          ]}
          icon={icon}
        />
      ) : (
        <FontAwesomeIcon
          size={12}
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
  const store = useStores()
  const tabSelectorRef = useRef<{open: () => void}>()
  const [isLocationMenuActive, setLocationMenuActive] = useState(false)
  const screenRenderDesc = constructScreenRenderDesc(store.nav)

  const onPressAvi = () => createAccountsMenu()
  const onPressLocation = () => setLocationMenuActive(true)
  const onPressEllipsis = () => createLocationMenu()

  const onNavigateLocation = (url: string) => {
    setLocationMenuActive(false)
    store.nav.navigate(url)
  }
  const onDismissLocationNavigator = () => setLocationMenuActive(false)

  const onPressBack = () => store.nav.tab.goBack()
  const onPressForward = () => store.nav.tab.goForward()
  const onPressHome = () => store.nav.navigate('/')
  const onPressNotifications = () => store.nav.navigate('/notifications')
  const onPressTabs = () => tabSelectorRef.current?.open()

  const onLongPressBack = () => createBackMenu(store.nav.tab)
  const onLongPressForward = () => createForwardMenu(store.nav.tab)

  const onNewTab = () => store.nav.newTab('/')
  const onChangeTab = (tabIndex: number) => store.nav.setActiveTab(tabIndex)
  const onCloseTab = (tabIndex: number) => store.nav.closeTab(tabIndex)

  return (
    <View style={styles.outerContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onPressAvi}>
          <Image style={styles.avi} source={AVIS['alice.com']} />
        </TouchableOpacity>
        <Location
          icon={screenRenderDesc.icon}
          title={store.nav.tab.current.title}
          onPress={onPressLocation}
        />
        <TouchableOpacity style={styles.topBarBtn} onPress={onPressEllipsis}>
          <FontAwesomeIcon icon="ellipsis" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={styles.innerContainer}>
        <ScreenContainer style={styles.screenContainer}>
          {screenRenderDesc.screens.map(({Com, params, key, visible}) => (
            <Screen
              key={key}
              style={[StyleSheet.absoluteFill, styles.screen]}
              activityState={visible ? 2 : 0}>
              <Com params={params} visible={visible} />
            </Screen>
          ))}
        </ScreenContainer>
      </SafeAreaView>
      <View style={styles.bottomBar}>
        <Btn
          icon="angle-left"
          inactive={!store.nav.tab.canGoBack}
          onPress={onPressBack}
          onLongPress={onLongPressBack}
        />
        <Btn
          icon="angle-right"
          inactive={!store.nav.tab.canGoForward}
          onPress={onPressForward}
          onLongPress={onLongPressForward}
        />
        <Btn icon="house" onPress={onPressHome} />
        <Btn icon={['far', 'bell']} onPress={onPressNotifications} />
        <Btn icon={['far', 'clone']} onPress={onPressTabs} />
      </View>
      <TabsSelectorModal
        ref={tabSelectorRef}
        tabs={store.nav.tabs}
        currentTabIndex={store.nav.tabIndex}
        onNewTab={onNewTab}
        onChangeTab={onChangeTab}
        onCloseTab={onCloseTab}
      />
      <Modal />
      {isLocationMenuActive && (
        <LocationNavigator
          url={store.nav.tab.current.url}
          onNavigate={onNavigateLocation}
          onDismiss={onDismissLocationNavigator}
        />
      )}
    </View>
  )
})

/**
 * This method produces the information needed by the shell to
 * render the current screens with screen-caching behaviors.
 */
type ScreenRenderDesc = MatchResult & {key: string; visible: boolean}
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
        visible: isCurrent,
      }) as ScreenRenderDesc
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
  screenContainer: {
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
  avi: {
    width: 28,
    height: 28,
    marginRight: 8,
    borderRadius: 14,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 6,
    paddingLeft: 10,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: colors.gray1,
    // justifyContent: 'center',
  },
  locationIcon: {
    color: colors.gray5,
    marginTop: 3,
    marginRight: 6,
  },
  locationIconNudgeUp: {
    marginTop: 2,
  },
  locationIconLight: {
    color: colors.gray5,
    marginTop: 2,
    marginRight: 8,
  },
  locationText: {
    color: colors.black,
  },
  locationTextLight: {
    color: colors.gray4,
  },
  topBarBtn: {
    marginLeft: 8,
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 6,
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
