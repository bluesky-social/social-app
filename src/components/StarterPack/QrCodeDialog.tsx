import {Suspense, useRef, useState} from 'react'
import {View} from 'react-native'
import type ViewShot from 'react-native-view-shot'
import {requestMediaLibraryPermissionsAsync} from 'expo-image-picker'
import {createAssetAsync} from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import {type AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {FloppyDisk_Stroke2_Corner0_Rounded as FloppyDiskIcon} from '#/components/icons/FloppyDisk'
import {Loader} from '#/components/Loader'
import {QrCode} from '#/components/StarterPack/QrCode'
import * as Toast from '#/components/Toast'
import {IS_NATIVE, IS_WEB} from '#/env'
import * as bsky from '#/types/bsky'

export function QrCodeDialog({
  starterPack,
  link,
  control,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  link?: string
  control: DialogControlProps
}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const [isSaveProcessing, setIsSaveProcessing] = useState(false)
  const [isCopyProcessing, setIsCopyProcessing] = useState(false)

  const ref = useRef<ViewShot>(null)

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
      if (IS_NATIVE) {
        const res = await requestMediaLibraryPermissionsAsync()

        if (!res.granted) {
          Toast.show(
            _(
              msg`You must grant access to your photo library to save a QR code`,
            ),
          )
          return
        }

        // Incase of a FS failure, don't crash the app
        try {
          await createAssetAsync(`file://${uri}`)
        } catch (e: unknown) {
          Toast.show(_(msg`An error occurred while saving the QR code!`), {
            type: 'error',
          })
          logger.error('Failed to save QR code', {error: e})
          return
        }
      } else {
        setIsSaveProcessing(true)

        if (
          !bsky.validate(
            starterPack.record,
            AppBskyGraphStarterpack.validateRecord,
          )
        ) {
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

      logger.metric('starterPack:share', {
        starterPack: starterPack.uri,
        shareType: 'qrcode',
        qrShareType: 'save',
      })
      setIsSaveProcessing(false)
      Toast.show(
        IS_WEB
          ? _(msg`QR code has been downloaded!`)
          : _(msg`QR code saved to your camera roll!`),
      )
      control.close()
    })
  }

  const onCopyPress = async () => {
    setIsCopyProcessing(true)
    ref.current?.capture?.().then(async (uri: string) => {
      const canvas = await getCanvas(uri)
      // @ts-expect-error web only
      canvas.toBlob((blob: Blob) => {
        const item = new ClipboardItem({'image/png': blob})
        navigator.clipboard.write([item])
      })

      logger.metric('starterPack:share', {
        starterPack: starterPack.uri,
        shareType: 'qrcode',
        qrShareType: 'copy',
      })
      Toast.show(_(msg`QR code copied to your clipboard!`))
      setIsCopyProcessing(false)
      control.close()
    })
  }

  const onSharePress = async () => {
    ref.current?.capture?.().then(async (uri: string) => {
      control.close(() => {
        Sharing.shareAsync(uri, {mimeType: 'image/png', UTI: 'image/png'}).then(
          () => {
            logger.metric('starterPack:share', {
              starterPack: starterPack.uri,
              shareType: 'qrcode',
              qrShareType: 'share',
            })
          },
        )
      })
    })
  }

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Create a QR code for a starter pack`)}>
        <View style={[a.flex_1, a.align_center, a.gap_5xl]}>
          <Suspense fallback={<Loading />}>
            {!link ? (
              <Loading />
            ) : (
              <>
                <QrCode starterPack={starterPack} link={link} ref={ref} />
                <View
                  style={[
                    a.w_full,
                    a.gap_md,
                    gtMobile && [a.flex_row, a.justify_center, a.flex_wrap],
                  ]}>
                  <Button
                    label={_(msg`Copy QR code`)}
                    color="primary_subtle"
                    size="large"
                    onPress={IS_WEB ? onCopyPress : onSharePress}>
                    <ButtonIcon
                      icon={
                        isCopyProcessing
                          ? Loader
                          : IS_WEB
                            ? ChainLinkIcon
                            : ShareIcon
                      }
                    />
                    <ButtonText>
                      {IS_WEB ? <Trans>Copy</Trans> : <Trans>Share</Trans>}
                    </ButtonText>
                  </Button>
                  <Button
                    label={_(msg`Save QR code`)}
                    color="secondary"
                    size="large"
                    onPress={onSavePress}>
                    <ButtonIcon
                      icon={isSaveProcessing ? Loader : FloppyDiskIcon}
                    />
                    <ButtonText>
                      <Trans>Save</Trans>
                    </ButtonText>
                  </Button>
                </View>
              </>
            )}
          </Suspense>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Loading() {
  return (
    <View style={[a.align_center, a.justify_center, {minHeight: 400}]}>
      <Loader size="xl" />
    </View>
  )
}
