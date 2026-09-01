import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {type RenderTabBarFnProps} from '#/view/com/pager/Pager'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
import {TabBar} from '../pager/TabBar'
import {HomeHeaderLayout} from './HomeHeaderLayout'

export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string
    onPressSelected: () => void
    feeds: FeedSourceInfo[]
  },
) {
  const {feeds, onSelect: onSelectProp} = props
  const {hasSession} = useSession()
  const navigation = useNavigation<NavigationProp>()

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

  const itemIcons = useMemo<React.ReactNode[]>(() => {
    const icons: React.ReactNode[] = feeds.map(f => (
      <FeedTabIcon key={f.uri} feed={f} />
    ))
    if (!hasPinnedCustom) {
      // No icon for the trailing "Feeds ✨" link.
      icons.push(undefined)
    }
    return icons
  }, [feeds, hasPinnedCustom])

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
        itemIcons={itemIcons}
        dragProgress={props.dragProgress}
        dragState={props.dragState}
        transparent
      />
    </HomeHeaderLayout>
  )
}

function FeedTabIcon({feed}: {feed: FeedSourceInfo}) {
  const t = useTheme()

  if (feed.uri === 'following' || feed.feedDescriptor === 'following') {
    return (
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_full,
          {width: 20, height: 20, backgroundColor: t.palette.primary_500},
        ]}>
        <FilterTimeline
          style={{width: 14, height: 14}}
          fill={t.palette.white}
        />
      </View>
    )
  }

  return (
    <View style={[a.rounded_full, a.overflow_hidden, {width: 20, height: 20}]}>
      <UserAvatar
        type={feed.type === 'list' ? 'list' : 'algo'}
        size={20}
        avatar={feed.avatar}
        noBorder
      />
    </View>
  )
}
