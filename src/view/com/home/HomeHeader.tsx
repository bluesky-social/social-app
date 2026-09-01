import {useCallback, useMemo} from 'react'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {TIMELINE_SAVED_FEED} from '#/lib/constants'
import {type NavigationProp} from '#/lib/routes/types'
import {getLocalizedFeedName} from '#/lib/strings/feed-names'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {type RenderTabBarFnProps} from '#/view/com/pager/Pager'
import {TabBar} from '../pager/TabBar'
import {HomeHeaderLayout} from './HomeHeaderLayout'

export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string
    onPressSelected: () => void
    feeds: Pick<FeedSourceInfo, 'displayName' | 'uri'>[]
  },
) {
  const {feeds, onSelect: onSelectProp} = props
  const {hasSession} = useSession()
  const {t: l, i18n} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const hasPinnedCustom = useMemo<boolean>(() => {
    if (!hasSession) return false
    return feeds.some(tab => {
      const isFollowing = tab.uri === TIMELINE_SAVED_FEED.value
      return !isFollowing
    })
  }, [feeds, hasSession])

  const items = useMemo(() => {
    const pinnedNames = feeds.map(f => getLocalizedFeedName(f, i18n))
    if (!hasPinnedCustom) {
      return pinnedNames.concat(l`Feeds ✨`)
    }
    return pinnedNames
  }, [i18n, l, hasPinnedCustom, feeds])

  const onPressFeedsLink = useCallback(() => {
    navigation.navigate('Feeds')
  }, [navigation])

  const onSelect = useCallback(
    (index: number) => {
      if (!hasPinnedCustom && index === items.length - 1) {
        onPressFeedsLink()
      } else if (onSelectProp) {
        onSelectProp(index)
      }
    },
    [items.length, onPressFeedsLink, onSelectProp, hasPinnedCustom],
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
        dragProgress={props.dragProgress}
        dragState={props.dragState}
        transparent
      />
    </HomeHeaderLayout>
  )
}
