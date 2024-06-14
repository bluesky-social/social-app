import React from 'react'
import {View} from 'react-native'
import {AppBskyGraphDefs} from '@atproto/api'

import {UserAvatar} from 'view/com/util/UserAvatar'
import {atoms as a} from '#/alf'

export function StarterPackAvatar({
  starterPack,
  size = 60,
}: {
  starterPack?: AppBskyGraphDefs.StarterPackView
  size?: number
}) {
  // TODO listItemsSample shouldn't be optional
  if (!starterPack || !starterPack.listItemsSample) return null

  const avatars = starterPack.listItemsSample.map(item => item.subject.avatar)

  return (
    <View
      style={[
        a.rounded_sm,
        a.overflow_hidden,
        {height: size, width: size, backgroundColor: '#0070FF'},
      ]}>
      <View style={[a.flex_1, a.flex_row]}>
        <UserAvatar avatar={avatars![0]} size={size / 2} type="square" />
        <UserAvatar avatar={avatars![1]} size={size / 2} type="square" />
      </View>
      <View style={[a.flex_1, a.flex_row]}>
        <UserAvatar avatar={avatars![2]} size={size / 2} type="square" />
        <UserAvatar avatar={avatars![3]} size={size / 2} type="square" />
      </View>
    </View>
  )
}
