import {View} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
import {shareUrl} from '#/lib/sharing'
import {getStarterPackOgCard} from '#/lib/strings/starter-pack'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {type DialogControlProps} from '#/components/Dialog'
import * as Dialog from '#/components/Dialog'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {QrCode_Stroke2_Corner0_Rounded as QrCodeIcon} from '#/components/icons/QrCode'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

interface Props {
  starterPack: AppBskyGraphDefs.StarterPackView
  link?: string
  imageLoaded?: boolean
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
  imageLoaded,
  qrDialogControl,
  control,
}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const imageUrl = getStarterPackOgCard(starterPack)

  const onShareLink = async () => {
    if (!link) return
    shareUrl(link)
    logger.metric('starterPack:share', {
      starterPack: starterPack.uri,
      shareType: 'link',
    })
    control.close()
  }

  const saveImageToAlbum = useSaveImageToMediaLibrary()

  const onSave = async () => {
    await saveImageToAlbum(imageUrl)
  }

  return (
    <>
      <Dialog.ScrollableInner label={_(msg`Share link dialog`)}>
        {!imageLoaded || !link ? (
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
            <Image
              source={{uri: imageUrl}}
              style={[
                a.rounded_sm,
                {
                  aspectRatio: 1200 / 630,
                  transform: [{scale: gtMobile ? 0.85 : 1}],
                  marginTop: gtMobile ? -20 : 0,
                },
              ]}
              accessibilityIgnoresInvertColors={true}
            />
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
                label={isWeb ? _(msg`Copy link`) : _(msg`Share link`)}
                color="primary_subtle"
                size="large"
                onPress={onShareLink}>
                <ButtonIcon icon={ChainLinkIcon} />
                <ButtonText>
                  {isWeb ? <Trans>Copy Link</Trans> : <Trans>Share link</Trans>}
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
              {isNative && (
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
