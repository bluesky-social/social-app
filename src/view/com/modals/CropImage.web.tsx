import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import ReactCrop, {PixelCrop} from 'react-image-crop'

import {useModalControls} from '#/state/modals'
import {usePalette} from 'lib/hooks/usePalette'
import {getDataUriSize} from 'lib/media/util'
import {gradients, s} from 'lib/styles'
import {Text} from 'view/com/util/text/Text'

export const snapPoints = ['0%']

export function Component({
  uri,
  onSelect,
}: {
  uri: string
  onSelect: (img?: RNImage) => void
}) {
  const pal = usePalette('default')
  const {_} = useLingui()

  const {closeModal} = useModalControls()

  const [crop, setCrop] = React.useState<PixelCrop>()

  const isEmpty = !crop || (crop.width || crop.height) === 0

  const onPressCancel = () => {
    onSelect(undefined)
    closeModal()
  }
  const onPressDone = async () => {
    if (!isEmpty) {
      const result = await manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: crop.x,
              originY: crop.y,
              width: crop.width,
              height: crop.height,
            },
          },
        ],
        {
          base64: true,
          format: SaveFormat.JPEG,
        },
      )

      onSelect({
        path: result.uri,
        mime: 'image/jpeg',
        size: result.base64 !== undefined ? getDataUriSize(result.base64) : 0,
        width: result.width,
        height: result.height,
      })
    } else {
      onSelect(undefined)
    }

    closeModal()
  }

  return (
    <View>
      <View style={[styles.cropper, pal.borderDark]}>
        <ReactCrop crop={crop} onChange={setCrop}>
          <img src={uri} style={{maxHeight: '75vh'}} />
        </ReactCrop>
      </View>
      <View style={styles.btns}>
        <TouchableOpacity
          onPress={onPressCancel}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Cancel image crop`)}
          accessibilityHint={_(msg`Exits image cropping process`)}>
          <Text type="xl" style={pal.link}>
            <Trans>Cancel</Trans>
          </Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity
          onPress={onPressDone}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Save image crop`)}
          accessibilityHint={_(msg`Saves image crop settings`)}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text type="xl-medium" style={s.white}>
              <Trans>Done</Trans>
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cropper: {
    marginLeft: 'auto',
    marginRight: 'auto',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
  },
  ctrls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  btns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  btn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
})
