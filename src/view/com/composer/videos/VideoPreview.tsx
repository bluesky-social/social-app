/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react'
import {ToastAndroid, View} from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import {useVideoPlayer, VideoView} from 'expo-video'

import {CompressedVideo} from '#/lib/media/video/compress'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

export function VideoPreview({
  video,
  clear,
}: {
  video: CompressedVideo
  clear: () => void
}) {
  const player = useVideoPlayer(video.uri, player => {
    player.loop = true
    player.play()
  })

  return (
    <>
      <View
        style={[
          a.w_full,
          a.rounded_sm,
          {aspectRatio: 16 / 9},
          a.overflow_hidden,
        ]}>
        <VideoView
          player={player}
          style={a.flex_1}
          allowsPictureInPicture={false}
          nativeControls={false}
        />
      </View>

      <View style={[a.flex_row, a.mt_sm, a.gap_sm]}>
        <Button
          onPress={clear}
          label="Clear"
          size="small"
          color="primary"
          variant="solid">
          <ButtonText>Clear</ButtonText>
        </Button>

        <Button
          onPress={() => {
            Sharing.shareAsync(video.uri)
          }}
          label="Share"
          size="small"
          color="primary"
          variant="solid">
          <ButtonText>Share</ButtonText>
        </Button>

        <Button
          onPress={async () => {
            if (!(await MediaLibrary.getPermissionsAsync()).granted) {
              await MediaLibrary.requestPermissionsAsync()
            }
            await MediaLibrary.createAssetAsync(video.uri)
            ToastAndroid.show('Saved to gallery', ToastAndroid.SHORT)
          }}
          label="Save"
          size="small"
          color="primary"
          variant="solid">
          <ButtonText>Save</ButtonText>
        </Button>
      </View>
    </>
  )
}
