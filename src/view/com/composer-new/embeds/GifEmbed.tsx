import React from 'react'
import {View} from 'react-native'

import {ComposerAction, getGifUrl, PostGifEmbed} from '../state'
import {ExternalEmbed} from './ExternalEmbed'

export const GifEmbed = ({
  active,
  postId,
  embed,
  dispatch,
}: {
  active: boolean
  postId: string
  embed: PostGifEmbed
  dispatch: React.Dispatch<ComposerAction>
}): React.ReactNode => {
  const gif = embed.gif

  return (
    <View>
      <ExternalEmbed
        active={active}
        postId={postId}
        embed={{
          type: 'external',
          uri: getGifUrl(gif),
          labels: [],
        }}
        dispatch={dispatch}
        isGif
      />

      {/* @todo: alt text */}
    </View>
  )
}
