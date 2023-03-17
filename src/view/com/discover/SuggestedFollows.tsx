import React from 'react'
import {StyleSheet, View} from 'react-native'
import {AppBskyActorRef, AppBskyActorProfile} from '@atproto/api'
import {RefWithInfoAndFollowers} from 'state/models/discovery/foafs'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'

export const SuggestedFollows = ({
  title,
  suggestions,
}: {
  title: string
  suggestions: (AppBskyActorRef.WithInfo | RefWithInfoAndFollowers)[]
}) => {
  const pal = usePalette('default')
  return (
    <View style={[styles.container, pal.view]}>
      <Text type="title" style={[styles.heading, pal.text]}>
        {title}
      </Text>
      {suggestions.map(item => (
        <View key={item.did} style={[styles.card, pal.view, pal.border]}>
          <ProfileCardWithFollowBtn
            key={item.did}
            did={item.did}
            declarationCid={item.declaration.cid}
            handle={item.handle}
            displayName={item.displayName}
            avatar={item.avatar}
            noBorder
            description=""
            followers={
              item.followers
                ? (item.followers as AppBskyActorProfile.View[])
                : undefined
            }
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },

  heading: {
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },

  card: {
    borderRadius: 12,
    marginBottom: 2,
    borderWidth: 1,
  },

  loadMore: {
    paddingLeft: 16,
    paddingVertical: 12,
  },
})
