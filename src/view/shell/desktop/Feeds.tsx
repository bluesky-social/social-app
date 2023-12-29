import React from 'react'
import {View, StyleSheet} from 'react-native'
import {useNavigationState} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {TextLink} from 'view/com/util/Link'
import {getCurrentRoute} from 'lib/routes/helpers'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {usePinnedFeedsInfos} from '#/state/queries/feed'

export function DesktopFeeds() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {feeds} = usePinnedFeedsInfos()

  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  return (
    <View style={[styles.container, pal.view]}>
      <FeedItem href="/" title="Following" current={route.name === 'Home'} />
      {feeds
        .filter(f => f.displayName !== 'Following')
        .map(feed => {
          try {
            const params = route.params as Record<string, string>
            const routeName =
              feed.type === 'feed' ? 'ProfileFeed' : 'ProfileList'
            return (
              <FeedItem
                key={feed.uri}
                href={feed.route.href}
                title={feed.displayName}
                current={
                  route.name === routeName &&
                  params.name === feed.route.params.name &&
                  params.rkey === feed.route.params.rkey
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
    // @ts-ignore web only -prf
    overflowY: 'auto',
    width: 300,
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
})
