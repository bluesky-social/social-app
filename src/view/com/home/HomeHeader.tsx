import {useCallback, useMemo} from 'react'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {FeedSourceInfo} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {NavigationProp} from 'lib/routes/types'
import {isWeb} from 'platform/detection'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from '../pager/TabBar'
import {HomeHeaderLayout} from './HomeHeaderLayout'

export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string
    onPressSelected: () => void
    feeds: FeedSourceInfo[]
  },
) {
  const {feeds} = props
  const {hasSession} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const pal = usePalette('default')

  const hasPinnedCustom = useMemo<boolean>(() => {
    if (!hasSession) return false
    return feeds.some(tab => {
      const isFollowing = tab.uri === 'following'
      return !isFollowing
    })
  }, [feeds, hasSession])

  const items = useMemo(() => {
    const pinnedNames = feeds.map(f => f.displayName)
    if (!hasPinnedCustom) {
      return pinnedNames.concat('Feeds ✨')
    }
    return pinnedNames
  }, [hasPinnedCustom, feeds])

  const onPressFeedsLink = useCallback(() => {
    if (isWeb) {
      navigation.navigate('Feeds')
    } else {
      navigation.navigate('FeedsTab')
      navigation.popToTop()
    }
  }, [navigation])

  const onSelect = useCallback(
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
