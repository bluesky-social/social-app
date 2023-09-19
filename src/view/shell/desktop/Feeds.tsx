import React from 'react'
import {View, StyleSheet} from 'react-native'
import {useNavigationState} from '@react-navigation/native'
import {AtUri} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {TextLink} from 'view/com/util/Link'
import {getCurrentRoute} from 'lib/routes/helpers'

export const DesktopFeeds = observer(function DesktopFeeds() {
  const store = useStores()
  const pal = usePalette('default')

  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  return (
    <View style={[styles.container, pal.view, pal.border]}>
      <FeedItem href="/" title="Following" current={route.name === 'Home'} />
      {store.me.savedFeeds.pinned.map(feed => {
        try {
          const {hostname, rkey} = new AtUri(feed.uri)
          const href = `/profile/${hostname}/feed/${rkey}`
          const params = route.params as Record<string, string>
          return (
            <FeedItem
              key={feed.uri}
              href={href}
              title={feed.displayName}
              current={
                route.name === 'CustomFeed' &&
                params.name === hostname &&
                params.rkey === rkey
              }
            />
          )
        } catch {
          return null
        }
      })}
      <View style={{paddingTop: 8, paddingBottom: 6}}>
        <TextLink
          type="lg"
          href="/feeds"
          text="More feeds"
          style={[pal.link]}
        />
      </View>
    </View>
  )
})

function FeedItem({
  title,
  href,
  current,
}: {
  title: string
  href: string
  current: boolean
}) {
  const pal = usePalette('default')
  return (
    <View style={{paddingVertical: 6}}>
      <TextLink
        type="xl"
        href={href}
        text={title}
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
    position: 'relative',
    width: 300,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 18,
  },
})
