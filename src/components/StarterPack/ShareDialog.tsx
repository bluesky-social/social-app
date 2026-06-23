import {lazy, Suspense, useRef} from 'react'
import {View} from 'react-native'
import type ViewShot from 'react-native-view-shot'
import {requestPermissionsAsync, saveToLibraryAsync} from 'expo-media-library'
import {type AppBskyGraphDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {shareUrl} from '#/lib/sharing'
import {logger} from '#/logger'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {QrCode_Stroke2_Corner0_Rounded as QrCodeIcon} from '#/components/icons/QrCode'
import {Loader} from '#/components/Loader'
import {StarterPackHero} from '#/components/StarterPack/StarterPackHero'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'

const LazyViewShot = lazy(
  // @ts-expect-error dynamic import
  () => import('react-native-view-shot/src/index'),
)

interface Props {
  starterPack: AppBskyGraphDefs.StarterPackView
  link?: string
  qrDialogControl: DialogControlProps
  control: DialogControlProps
}

export function ShareDialog(props: Props) {
  return (
    <Dialog.Outer
      control={props.control}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <ShareDialogInner {...props} />
    </Dialog.Outer>
  )
}

function ShareDialogInner({
  starterPack,
  link,
  qrDialogControl,
  control,
}: Props) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const ref = useRef<ViewShot>(null)

  const onShareLink = async () => {
    if (!link) return
    shareUrl(link)
    ax.metric('starterPack:share', {
      starterPack: starterPack.uri,
      shareType: 'link',
    })
    control.close()
  }

  // Native-only: capture the rendered card (no remote image service) and save
  // it to the photo library.
  const onSave = async () => {
    const uri = await ref.current?.capture?.()
    if (!uri) return

    // Write-only permission - saving does not require read access.
    const res = await requestPermissionsAsync(true)
    if (!res.granted) {
      Toast.show(
        _(msg`You must grant access to your photo library to save the image`),
      )
      return
    }

    try {
      await saveToLibraryAsync(`file://${uri}`)
    } catch (e: unknown) {
      Toast.show(_(msg`An error occurred while saving the image!`), {
        type: 'error',
      })
      logger.error('Failed to save starter pack image', {error: e})
      return
    }

    Toast.show(_(msg`Image saved to your camera roll!`))
    control.close()
  }

  return (
    <>
      <Dialog.ScrollableInner label={_(msg`Share link dialog`)}>
        {!link ? (
          <View style={[a.align_center, a.justify_center, {minHeight: 350}]}>
            <Loader size="xl" />
          </View>
        ) : (
          <View style={[!gtMobile && a.gap_lg]}>
            <View style={[a.gap_sm, gtMobile && a.pb_lg]}>
              <Text style={[a.font_semi_bold, a.text_2xl]}>
                <Trans>Invite people to this starter pack!</Trans>
              </Text>
              <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                <Trans>
                  Share this starter pack and help people join your community on
                  Bluesky.
                </Trans>
              </Text>
            </View>
            <View
              style={[
                a.rounded_sm,
                a.overflow_hidden,
                {
                  transform: [{scale: gtMobile ? 0.85 : 1}],
                  marginTop: gtMobile ? -20 : 0,
                },
              ]}>
              <Suspense
                fallback={
                  <View
                    style={[
                      a.w_full,
                      a.aspect_card,
                      a.align_center,
                      a.justify_center,
                    ]}>
                    <Loader size="xl" />
                  </View>
                }>
                <LazyViewShot ref={ref}>
                  <StarterPackHero starterPack={starterPack} />
                </LazyViewShot>
              </Suspense>
            </View>
            <View
              style={[
                a.gap_md,
                gtMobile && [
                  a.gap_sm,
                  a.justify_center,
                  a.flex_row,
                  a.flex_wrap,
                ],
              ]}>
              <Button
                label={IS_WEB ? _(msg`Copy link`) : _(msg`Share link`)}
                color="primary_subtle"
                size="large"
                onPress={onShareLink}>
                <ButtonIcon icon={ChainLinkIcon} />
                <ButtonText>
                  {IS_WEB ? (
                    <Trans>Copy Link</Trans>
                  ) : (
                    <Trans>Share link</Trans>
                  )}
                </ButtonText>
              </Button>
              <Button
                label={_(msg`Share QR code`)}
                color="primary_subtle"
                size="large"
                onPress={() => {
                  control.close(() => {
                    qrDialogControl.open()
                  })
                }}>
                <ButtonIcon icon={QrCodeIcon} />
                <ButtonText>
                  <Trans>Share QR code</Trans>
                </ButtonText>
              </Button>
              {IS_NATIVE && (
                <Button
                  label={_(msg`Save image`)}
                  color="secondary"
                  size="large"
                  onPress={onSave}>
                  <ButtonIcon icon={DownloadIcon} />
                  <ButtonText>
                    <Trans>Save image</Trans>
                  </ButtonText>
                </Button>
              )}
            </View>
          </View>
        )}
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </>
  )
}
