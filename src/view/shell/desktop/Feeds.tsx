import React from 'react'
import {View, StyleSheet} from 'react-native'
import {useNavigationState} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useDesktopRightNavItems} from 'lib/hooks/useDesktopRightNavItems'
import {TextLink} from 'view/com/util/Link'
import {getCurrentRoute} from 'lib/routes/helpers'

export const DesktopFeeds = observer(function DesktopFeeds() {
  const store = useStores()
  const pal = usePalette('default')
  const items = useDesktopRightNavItems(store.preferences.pinnedFeeds)

  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  return (
    <View style={[styles.container, pal.view, pal.border]}>
      <FeedItem href="/" title="Following" current={route.name === 'Home'} />
      {items.map(item => {
        try {
          const params = route.params as Record<string, string>
          const routeName =
            item.collection === 'app.bsky.feed.generator'
              ? 'ProfileFeed'
              : 'ProfileList'
          return (
            <FeedItem
              key={item.uri}
              href={item.href}
              title={item.displayName}
              current={
                route.name === routeName &&
                params.name === item.hostname &&
                params.rkey === item.rkey
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
    flex: 1,
    overflowY: 'auto',
    width: 300,
    paddingHorizontal: 12,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
})
