import React from 'react'
import {View} from 'react-native'
import * as FS from 'expo-file-system'
import {AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {nanoid} from 'nanoid/non-secure'

import {saveImageToMediaLibrary} from 'lib/media/manip'
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

  // No types for this
  // See https://github.com/tokkozhin/react-native-qrcode-styled/blob/main/example/src/examples/DownloadQR.tsx for usage
  const qrCodeRef = React.useRef<any>()

  const onSavePress = () => {
    qrCodeRef.current?.toDataURL(async (base64Code: string) => {
      const filename = `${FS.cacheDirectory}/${nanoid(12)}.png`
      await FS.writeAsStringAsync(filename, base64Code, {
        encoding: FS.EncodingType.Base64,
      })

      await saveImageToMediaLibrary({uri: filename})
      control.close(() => {
        Toast.show(_(msg`QR code saved to your camera roll!`))
      })
    })
  }
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Create a QR code for a starter pack`)}>
        <View style={[a.flex_1, a.align_center, a.gap_3xl]}>
          <Text style={[a.font_bold, a.text_xl, a.text_center]}>
            Share this starter pack with friends!
          </Text>
          <QrCode starterPack={starterPack} />
          <Button
            label={_(msg`Save QR code`)}
            variant="solid"
            color="primary"
            size="medium"
            onPress={onSavePress}>
            <ButtonText>
              <Trans>Save QR code</Trans>
            </ButtonText>
          </Button>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
