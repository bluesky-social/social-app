import React from 'react'
import {StyleSheet, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {RefWithInfoAndFollowers} from 'state/models/discovery/foafs'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'

export const SuggestedFollows = ({
  title,
  suggestions,
}: {
  title: string
  suggestions: (
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileView
    | RefWithInfoAndFollowers
  )[]
}) => {
  const pal = usePalette('default')
  return (
    <View style={[styles.container, pal.view, pal.border]}>
      <Text type="title" style={[styles.heading, pal.text]}>
        {title}
      </Text>
      {suggestions.map(item => (
        <View key={item.did} style={[styles.card, pal.view, pal.border]}>
          <ProfileCardWithFollowBtn
            key={item.did}
            did={item.did}
            handle={item.handle}
            displayName={item.displayName}
            avatar={item.avatar}
            labels={item.labels}
            noBg
            noBorder
            description={
              item.description
                ? (item as AppBskyActorDefs.ProfileView).description
                : ''
            }
            followers={
              item.followers
                ? (item.followers as AppBskyActorDefs.ProfileView[])
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
    borderBottomWidth: 1,
  },

  heading: {
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },

  card: {
    borderTopWidth: 1,
  },
})
