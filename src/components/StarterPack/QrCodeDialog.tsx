import React from 'react'
import {View} from 'react-native'
import QRCode from 'react-native-qrcode-styled'
import * as FS from 'expo-file-system'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {nanoid} from 'nanoid/non-secure'

import {saveImageToMediaLibrary} from 'lib/media/manip'
import * as Toast from '#/view/com/util/Toast'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DialogControlProps} from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function QrCodeDialog({
  control,
  url,
}: {
  control: DialogControlProps
  url: string
}) {
  const {_} = useLingui()
  const t = useTheme()

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
      Toast.show(_(msg`QR code saved to your camera roll!`))
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
          <View style={[t.atoms.bg_contrast_25, a.rounded_md]}>
            <QRCode
              data={url}
              style={[{height: 200, width: 200}]}
              pieceSize={8}
              padding={20}
              // pieceLiquidRadius={2}
              pieceBorderRadius={4.5}
              outerEyesOptions={{
                topLeft: {
                  borderRadius: [12, 12, 0, 12],
                  color: t.palette.primary_500,
                },
                topRight: {
                  borderRadius: [12, 12, 12, 0],
                  color: t.palette.primary_500,
                },
                bottomLeft: {
                  borderRadius: [12, 0, 12, 12],
                  color: t.palette.primary_500,
                },
              }}
              innerEyesOptions={{borderRadius: 3}}
              logo={{
                href: require('../../../assets/logo.png'),
                scale: 1.2,
                padding: 2,
                hidePieces: true,
              }}
              ref={qrCodeRef}
            />
          </View>
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
