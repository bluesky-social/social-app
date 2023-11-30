import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {TabBar} from 'view/com/pager/TabBar'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {usePalette} from 'lib/hooks/usePalette'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {s} from 'lib/styles'
import {HITSLOP_10} from 'lib/constants'
import Animated from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useSession} from '#/state/session'
import {usePinnedFeedsInfos} from '#/state/queries/feed'
import {isWeb} from 'platform/detection'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'

export function FeedsTabBar(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
  const pal = usePalette('default')
  const {isSandbox, hasSession} = useSession()
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {feeds, hasPinnedCustomFeedOrList} = usePinnedFeedsInfos()
  const brandBlue = useColorSchemeStyle(s.brandBlue, s.blue3)
  const {headerHeight} = useShellLayout()
  const {headerMinimalShellTransform} = useMinimalShellMode()
  const pinnedDisplayNames = hasSession ? feeds.map(f => f.displayName) : []
  const showFeedsLinkInTabBar = hasSession && !hasPinnedCustomFeedOrList
  const items = showFeedsLinkInTabBar
    ? pinnedDisplayNames.concat('Feeds ✨')
    : pinnedDisplayNames

  const onPressFeedsLink = React.useCallback(() => {
    if (isWeb) {
      navigation.navigate('Feeds')
    } else {
      navigation.navigate('FeedsTab')
      navigation.popToTop()
    }
  }, [navigation])

  const onSelect = React.useCallback(
    (index: number) => {
      if (showFeedsLinkInTabBar && index === items.length - 1) {
        onPressFeedsLink()
      } else if (props.onSelect) {
        props.onSelect(index)
      }
    },
    [items.length, onPressFeedsLink, props, showFeedsLinkInTabBar],
  )

  const onPressAvi = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  return (
    <Animated.View
      style={[pal.view, pal.border, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[pal.view, styles.topBar]}>
        <View style={[pal.view]}>
          <TouchableOpacity
            testID="viewHeaderDrawerBtn"
            onPress={onPressAvi}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Open navigation`)}
            accessibilityHint="Access profile and other navigation links"
            hitSlop={HITSLOP_10}>
            <FontAwesomeIcon
              icon="bars"
              size={18}
              color={pal.colors.textLight}
            />
          </TouchableOpacity>
        </View>
        <Text style={[brandBlue, s.bold, styles.title]}>
          {isSandbox ? 'SANDBOX' : 'Bluesky'}
        </Text>
        <View style={[pal.view, {width: 18}]}>
          {hasSession && (
            <Link
              testID="viewHeaderHomeFeedPrefsBtn"
              href="/settings/home-feed"
              hitSlop={HITSLOP_10}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Home Feed Preferences`)}
              accessibilityHint="">
              <FontAwesomeIcon
                icon="sliders"
                style={pal.textLight as FontAwesomeIconStyle}
              />
            </Link>
          )}
        </View>
      </View>

      {items.length > 0 && (
        <TabBar
          key={items.join(',')}
          onPressSelected={props.onPressSelected}
          selectedPage={props.selectedPage}
          onSelect={onSelect}
          testID={props.testID}
          items={items}
          indicatorColor={pal.colors.link}
        />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'column',
    borderBottomWidth: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    width: '100%',
  },
  title: {
    fontSize: 21,
  },
})
