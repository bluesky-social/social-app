import React, {useCallback, useImperativeHandle, useRef} from 'react'
import {Text, View} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import ReactCrop, {PercentCrop} from 'react-image-crop'

import {CropperOptions} from '#/lib/media/types'
import {getDataUriSize} from '#/lib/media/util'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'

export type CropImage = (opts: CropperOptions) => Promise<RNImage>
type CropImageCallback = (
  opts: CropperOptions,
  onComplete: CropperCallback,
) => void
type CropperCallback = (image: RNImage | null) => unknown

export function useImageCropperControl(): [
  ref: React.Ref<{openCropper: CropImageCallback}>,
  crop: CropImage,
] {
  const ref = useRef<{openCropper: CropImageCallback}>(null)
  const crop = useCallback((opts: CropperOptions) => {
    return new Promise<RNImage>((resolve, reject) => {
      if (!ref.current) {
        console.error('ImageCropper error - ref is not connected to the dialog')
        reject(new Error('Ref not connected'))
        return
      }
      ref.current.openCropper(opts, image => {
        if (image) {
          resolve(image)
        } else {
          reject(new Error('User cancelled'))
        }
      })
    })
  }, [])
  return [ref, crop] as const
}

export function CropImageDialog({
  controlRef,
}: {
  controlRef: React.Ref<{openCropper: CropImageCallback}>
}) {
  const control = Dialog.useDialogControl()
  const [opts, setOpts] = React.useState<CropperOptions | null>(null)
  const callbackRef = useRef<CropperCallback | null>(null)

  useImperativeHandle(controlRef, () => ({
    openCropper: (opts, onComplete) => {
      setOpts(opts)
      callbackRef.current = onComplete
      control.open()
    },
  }))

  const onCrop = (image: RNImage) => {
    if (callbackRef.current) {
      callbackRef.current(image)
      callbackRef.current = null
    }
    control.close()
  }

  return (
    <Dialog.Outer
      control={control}
      onClose={() => {
        // closed without saving
        if (callbackRef.current) {
          callbackRef.current(null)
          callbackRef.current = null
        }
        // cleanup
        setOpts(null)
      }}>
      <Dialog.Handle />
      <DialogInner opts={opts} onCrop={onCrop} />
    </Dialog.Outer>
  )
}

function DialogInner({
  opts,
  onCrop,
}: {
  opts: CropperOptions | null
  onCrop: (image: RNImage) => void
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const imageRef = React.useRef<HTMLImageElement>(null)
  const [crop, setCrop] = React.useState<PercentCrop>()
  const t = useTheme()

  if (!opts) {
    control.close()
    return null
  }

  const uri = opts.path
  const aspect = opts.webAspectRatio
  const circular = opts.webCircularCrop

  const isEmpty = !crop || (crop.width || crop.height) === 0

  const onPressDone = async () => {
    const img = imageRef.current
    if (!img) {
      return
    }

    const actions = isEmpty
      ? []
      : [
          {
            crop: {
              originX: (crop.x * img.naturalWidth) / 100,
              originY: (crop.y * img.naturalHeight) / 100,
              width: (crop.width * img.naturalWidth) / 100,
              height: (crop.height * img.naturalHeight) / 100,
            },
          },
        ]

    const result = await manipulateAsync(uri, actions, {
      base64: true,
      format: SaveFormat.JPEG,
    })

    onCrop({
      path: result.uri,
      mime: 'image/jpeg',
      size: result.base64 !== undefined ? getDataUriSize(result.base64) : 0,
      width: result.width,
      height: result.height,
    })

    control.close()
  }

  return (
    <Dialog.Inner label={_(msg`Crop image`)}>
      <Dialog.Close />
      <View style={[a.gap_xl]}>
        <Text
          style={[a.text_2xl, a.font_bold, a.leading_tight, a.mb_sm, a.mt_sm]}>
          <Trans>Edit image</Trans>
        </Text>
        <View
          style={[
            a.mx_auto,
            a.border,
            a.overflow_hidden,
            a.rounded_xs,
            a.align_center,
            t.atoms.border_contrast_medium,
          ]}>
          <ReactCrop
            aspect={aspect}
            crop={crop}
            onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
            circularCrop={circular}
            className="ReactCrop--no-animate">
            <img ref={imageRef} src={uri} style={{maxHeight: '75vh'}} />
          </ReactCrop>
        </View>
        <View style={[a.flex_1, a.flex_row, a.gap_lg, a.justify_end]}>
          <Button
            label={_(msg`Cancel`)}
            onPress={() => control.close()}
            color="secondary"
            size="small"
            variant="solid">
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`Done`)}
            onPress={onPressDone}
            color="primary"
            size="small"
            variant="solid">
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.Inner>
  )
}
