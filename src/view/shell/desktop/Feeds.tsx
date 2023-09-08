import React from 'react'
import {View, StyleSheet} from 'react-native'
import {useNavigationState} from '@react-navigation/native'
import {AtUri} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {CogIcon} from 'lib/icons'
import {TextLink} from 'view/com/util/Link'
import {getCurrentRoute} from 'lib/routes/helpers'

export const DesktopFeeds = observer(function DesktopFeeds() {
  const store = useStores()
  const pal = usePalette('default')

  // NOTE
  // we use this to trigger re-renders on nav changes
  // the links establish if they're current by looking at the window.location
  // -prf
  // useNavigationState(state => state || {})

  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  return (
    <View style={[styles.container, pal.view, pal.border]}>
      <TextLink
        type="sm-bold"
        href="/settings/saved-feeds"
        text={
          <>
            My Feeds <CogIcon style={pal.text} size={16} strokeWidth={1.3} />
          </>
        }
        style={[
          pal.text,
          {display: 'flex', alignItems: 'center', paddingVertical: 6},
        ]}
      />
      <FeedItem href="/" title="Following" current={route.name === 'Home'} />
      {[...store.me.savedFeeds.pinned, ...store.me.savedFeeds.unpinned].map(
        feed => {
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
        },
      )}
      <View style={{paddingVertical: 6}}>
        <TextLink
          type="lg"
          href="/search/feeds"
          text="Find more"
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
        type={current ? 'xl-medium' : 'xl'}
        href={href}
        text={title}
        style={[current ? pal.text : pal.textLight, {letterSpacing: 0.15}]}
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
