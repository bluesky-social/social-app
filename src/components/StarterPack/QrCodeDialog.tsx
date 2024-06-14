import React from 'react'
import {View} from 'react-native'
import ViewShot from 'react-native-view-shot'
import {setImageAsync} from 'expo-clipboard'
import * as FS from 'expo-file-system'
import {requestMediaLibraryPermissionsAsync} from 'expo-image-picker'
import {AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {nanoid} from 'nanoid/non-secure'

import {saveImageToMediaLibrary} from 'lib/media/manip'
import {isNative} from 'platform/detection'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DialogControlProps} from '#/components/Dialog'
import {QrCode} from '#/components/StarterPack/QrCode'
import {Text} from '#/components/Typography'

export function QrCodeDialog({
  control,
  starterPack,
}: {
  control: DialogControlProps
  starterPack: AppBskyGraphDefs.StarterPackView
}) {
  const {_} = useLingui()

  const ref = React.useRef<ViewShot>(null)

  const getCanvas = (base64: string): Promise<HTMLCanvasElement> => {
    return new Promise(resolve => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(image, 0, 0)
        resolve(canvas)
      }
      image.src = base64
    })
  }

  const onSavePress = async () => {
    ref.current?.capture?.().then(async (uri: string) => {
      if (isNative) {
        const res = await requestMediaLibraryPermissionsAsync()

        if (!res) {
          Toast.show(
            _(
              msg`You must grant access to your photo library to save a QR code`,
            ),
          )
          return
        }

        const filename = `${FS.cacheDirectory}/${nanoid(12)}.png`
        await FS.copyAsync({from: uri, to: filename})

        await saveImageToMediaLibrary({uri: filename})
        await FS.deleteAsync(filename)
      } else {
        if (!AppBskyGraphStarterpack.isRecord(starterPack.record)) {
          return
        }

        const canvas = await getCanvas(uri)
        const imgHref = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream')

        const link = document.createElement('a')
        link.setAttribute(
          'download',
          `${starterPack.record.name.replaceAll(' ', '_')}_Share_Card.png`,
        )
        link.setAttribute('href', imgHref)
        link.click()
      }

      Toast.show(_(msg`QR code saved to your camera roll!`))
      control.close()
    })
  }

  const onCopyPress = async () => {
    ref.current?.capture?.().then(async (uri: string) => {
      if (isNative) {
        const base64 = await FS.readAsStringAsync(uri, {encoding: 'base64'})
        await setImageAsync(base64)
      } else {
        const canvas = await getCanvas(uri)
        // @ts-expect-error web only
        canvas.toBlob((blob: Blob) => {
          const item = new ClipboardItem({'image/png': blob})
          navigator.clipboard.write([item])
        })
      }

      Toast.show(_(msg`QR code copied to your clipboard!`))
      control.close()
    })
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Create a QR code for a starter pack`)}>
        <View style={[a.flex_1, a.align_center, a.gap_5xl]}>
          <Text style={[a.font_bold, a.text_xl, a.text_center]}>
            Share this starter pack with friends!
          </Text>
          <QrCode starterPack={starterPack} ref={ref} />
          <View style={[a.flex_row, a.gap_md]}>
            <Button
              label={_(msg`Save QR code`)}
              variant="solid"
              color="primary"
              size="medium"
              onPress={onSavePress}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
            <Button
              label={_(msg`Copy QR code`)}
              variant="solid"
              color="primary"
              size="medium"
              onPress={onCopyPress}>
              <ButtonText>
                <Trans>Copy</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
