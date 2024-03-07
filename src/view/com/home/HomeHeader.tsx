import React from 'react'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {HomeHeaderLayout} from './HomeHeaderLayout'
import {FeedSourceInfo} from '#/state/queries/feed'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {isWeb} from 'platform/detection'
import {TabBar} from '../pager/TabBar'
import {usePalette} from '#/lib/hooks/usePalette'

export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string
    onPressSelected: () => void
    feeds: FeedSourceInfo[]
  },
) {
  const {feeds} = props
  const navigation = useNavigation<NavigationProp>()
  const pal = usePalette('default')

  const hasPinnedCustom = React.useMemo<boolean>(() => {
    return feeds.some(tab => tab.uri !== '')
  }, [feeds])

  const items = React.useMemo(() => {
    const pinnedNames = feeds.map(f => f.displayName)
    if (!hasPinnedCustom) {
      return pinnedNames.concat('Feeds ✨')
    }
    return pinnedNames
  }, [hasPinnedCustom, feeds])

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
      if (!hasPinnedCustom && index === items.length - 1) {
        onPressFeedsLink()
      } else if (props.onSelect) {
        props.onSelect(index)
      }
    },
    [items.length, onPressFeedsLink, props, hasPinnedCustom],
  )

  return (
    <HomeHeaderLayout tabBarAnchor={props.tabBarAnchor}>
      <TabBar
        key={items.join(',')}
        onPressSelected={props.onPressSelected}
        selectedPage={props.selectedPage}
        onSelect={onSelect}
        testID={props.testID}
        items={items}
        indicatorColor={pal.colors.link}
      />
    </HomeHeaderLayout>
  )
}
