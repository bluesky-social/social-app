import React from 'react'
import {View, StyleSheet} from 'react-native'
import {useNavigationState, useNavigation} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {TextLink} from 'view/com/util/Link'
import {getCurrentRoute} from 'lib/routes/helpers'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {usePinnedFeedsInfos} from '#/state/queries/feed'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {NavigationProp} from 'lib/routes/types'
import {emitSoftReset} from '#/state/events'

export function DesktopFeeds() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {data: pinnedFeedInfos} = usePinnedFeedsInfos()
  const selectedFeed = useSelectedFeed()
  const setSelectedFeed = useSetSelectedFeed()
  const navigation = useNavigation<NavigationProp>()
  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })
  if (!pinnedFeedInfos) {
    return null
  }
  return (
    <View style={[styles.container, pal.view]}>
      {pinnedFeedInfos.map(feedInfo => {
        const uri = feedInfo.uri
        let feed: FeedDescriptor
        if (!uri) {
          feed = 'home'
        } else if (uri.includes('app.bsky.feed.generator')) {
          feed = `feedgen|${uri}`
        } else if (uri.includes('app.bsky.graph.list')) {
          feed = `list|${uri}`
        } else {
          return null
        }
        return (
          <FeedItem
            key={feed}
            href={'/?' + new URLSearchParams([['feed', feed]])}
            title={feedInfo.displayName}
            current={route.name === 'Home' && feed === selectedFeed}
            onPress={() => {
              setSelectedFeed(feed)
              navigation.navigate('Home')
              if (feed === selectedFeed) {
                emitSoftReset()
              }
            }}
          />
        )
      })}
      <View style={{paddingTop: 8, paddingBottom: 6}}>
        <TextLink
          type="lg"
          href="/feeds"
          text={_(msg`More feeds`)}
          style={[pal.link]}
        />
      </View>
    </View>
  )
}

function FeedItem({
  title,
  href,
  current,
  onPress,
}: {
  title: string
  href: string
  current: boolean
  onPress: () => void
}) {
  const pal = usePalette('default')
  return (
    <View style={{paddingVertical: 6}}>
      <TextLink
        type="xl"
        href={href}
        text={title}
        onPress={onPress}
        style={[
          current ? pal.text : pal.textLight,
          {letterSpacing: 0.15, fontWeight: current ? '500' : 'normal'},
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // @ts-ignore web only -prf
    overflowY: 'auto',
    width: 300,
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
})
