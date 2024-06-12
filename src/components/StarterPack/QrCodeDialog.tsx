import React from 'react'
import {View} from 'react-native'
import ViewShot from 'react-native-view-shot'
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

  const ref = React.useRef<ViewShot>(null)

  const onSavePress = () => {
    ref.current?.capture?.().then(async (uri: string) => {
      const filename = `${FS.cacheDirectory}/${nanoid(12)}.png`
      await FS.copyAsync({from: uri, to: filename})

      await saveImageToMediaLibrary({uri: filename})
      await FS.deleteAsync(filename)
      Toast.show(_(msg`QR code saved to your camera roll!`))

      control.close()
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
          <QrCode starterPack={starterPack} ref={ref} />
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
