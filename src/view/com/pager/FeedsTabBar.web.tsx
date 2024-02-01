import React from 'react'
import {View, StyleSheet} from 'react-native'
import Animated from 'react-native-reanimated'
import {TabBar} from 'view/com/pager/TabBar'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {FeedsTabBar as FeedsTabBarMobile} from './FeedsTabBarMobile'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useShellLayout} from '#/state/shell/shell-layout'
import {usePinnedFeedsInfos} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {TextLink} from '#/view/com/util/Link'
import {CenteredView} from '../util/Views'
import {isWeb} from 'platform/detection'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'

export function FeedsTabBar(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
  const {isMobile, isTablet} = useWebMediaQueries()
  const {hasSession} = useSession()

  if (isMobile) {
    return <FeedsTabBarMobile {...props} />
  } else if (isTablet) {
    if (hasSession) {
      return <FeedsTabBarTablet {...props} />
    } else {
      return <FeedsTabBarPublic />
    }
  } else {
    return null
  }
}

function FeedsTabBarPublic() {
  const pal = usePalette('default')
  const {isSandbox} = useSession()

  return (
    <CenteredView sideBorders>
      <View
        style={[
          pal.view,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingVertical: 12,
          },
        ]}>
        <TextLink
          type="title-lg"
          href="/"
          style={[pal.text, {fontWeight: 'bold'}]}
          text={
            <>
              {isSandbox ? 'SANDBOX' : 'Bluesky'}{' '}
              {/*hasNew && (
                <View
                  style={{
                    top: -8,
                    backgroundColor: colors.blue3,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                  }}
                />
              )*/}
            </>
          }
          // onPress={emitSoftReset}
        />
      </View>
    </CenteredView>
  )
}

function FeedsTabBarTablet(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
  const {feeds, hasPinnedCustom} = usePinnedFeedsInfos()
  const pal = usePalette('default')
  const {hasSession} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const {headerMinimalShellTransform} = useMinimalShellMode()
  const {headerHeight} = useShellLayout()

  const items = React.useMemo(() => {
    if (!hasSession) return []

    const pinnedNames = feeds.map(f => f.displayName)

    if (!hasPinnedCustom) {
      return pinnedNames.concat('Feeds ✨')
    }
    return pinnedNames
  }, [hasSession, hasPinnedCustom, feeds])

  const onPressDiscoverFeeds = React.useCallback(() => {
    if (isWeb) {
      navigation.navigate('Feeds')
    } else {
      navigation.navigate('FeedsTab')
      navigation.popToTop()
    }
  }, [navigation])

  const onSelect = React.useCallback(
    (index: number) => {
      if (hasSession && !hasPinnedCustom && index === items.length - 1) {
        onPressDiscoverFeeds()
      } else if (props.onSelect) {
        props.onSelect(index)
      }
    },
    [items.length, onPressDiscoverFeeds, props, hasSession, hasPinnedCustom],
  )

  return (
    // @ts-ignore the type signature for transform wrong here, translateX and translateY need to be in separate objects -prf
    <Animated.View
      style={[pal.view, pal.border, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <TabBar
        key={items.join(',')}
        {...props}
        onSelect={onSelect}
        items={items}
        indicatorColor={pal.colors.link}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    // @ts-ignore Web only
    position: 'sticky',
    zIndex: 1,
    // @ts-ignore Web only -prf
    left: 'calc(50% - 300px)',
    width: 600,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
})
