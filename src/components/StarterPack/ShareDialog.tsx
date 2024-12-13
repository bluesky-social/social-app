import {View} from 'react-native'
import {Image} from 'expo-image'
import {requestMediaLibraryPermissionsAsync} from 'expo-image-picker'
import {AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {saveImageToMediaLibrary} from '#/lib/media/manip'
import {shareUrl} from '#/lib/sharing'
import {logEvent} from '#/lib/statsig/statsig'
import {getStarterPackOgCard} from '#/lib/strings/starter-pack'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {DialogControlProps} from '#/components/Dialog'
import * as Dialog from '#/components/Dialog'
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
    <Dialog.Outer control={props.control}>
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
  const {isTabletOrDesktop} = useWebMediaQueries()

  const imageUrl = getStarterPackOgCard(starterPack)

  const onShareLink = async () => {
    if (!link) return
    shareUrl(link)
    logEvent('starterPack:share', {
      starterPack: starterPack.uri,
      shareType: 'link',
    })
    control.close()
  }

  const onSave = async () => {
    const res = await requestMediaLibraryPermissionsAsync()

    if (!res) {
      Toast.show(
        _(msg`You must grant access to your photo library to save the image.`),
        'xmark',
      )
      return
    }

    try {
      await saveImageToMediaLibrary({uri: imageUrl})
      Toast.show(_(msg`Image saved to your camera roll!`))
      control.close()
    } catch (e: unknown) {
      Toast.show(_(msg`An error occurred while saving the QR code!`), 'xmark')
      logger.error('Failed to save QR code', {error: e})
      return
    }
  }

  return (
    <>
      <Dialog.ScrollableInner label={_(msg`Share link dialog`)}>
        {!imageLoaded || !link ? (
          <View style={[a.p_xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : (
          <View style={[!isTabletOrDesktop && a.gap_lg]}>
            <View style={[a.gap_sm, isTabletOrDesktop && a.pb_lg]}>
              <Text style={[a.font_bold, a.text_2xl]}>
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
                  transform: [{scale: isTabletOrDesktop ? 0.85 : 1}],
                  marginTop: isTabletOrDesktop ? -20 : 0,
                },
              ]}
              accessibilityIgnoresInvertColors={true}
            />
            <View
              style={[
                a.gap_md,
                isWeb && [a.gap_sm, a.flex_row_reverse, {marginLeft: 'auto'}],
              ]}>
              <Button
                label={isWeb ? _(msg`Copy link`) : _(msg`Share link`)}
                variant="solid"
                color="secondary"
                size="small"
                style={[isWeb && a.self_center]}
                onPress={onShareLink}>
                <ButtonText>
                  {isWeb ? <Trans>Copy Link</Trans> : <Trans>Share link</Trans>}
                </ButtonText>
              </Button>
              <Button
                label={_(msg`Share QR code`)}
                variant="solid"
                color="secondary"
                size="small"
                style={[isWeb && a.self_center]}
                onPress={() => {
                  control.close(() => {
                    qrDialogControl.open()
                  })
                }}>
                <ButtonText>
                  <Trans>Share QR code</Trans>
                </ButtonText>
              </Button>
              {isNative && (
                <Button
                  label={_(msg`Save image`)}
                  variant="ghost"
                  color="secondary"
                  size="small"
                  style={[isWeb && a.self_center]}
                  onPress={onSave}>
                  <ButtonText>
                    <Trans>Save image</Trans>
                  </ButtonText>
                </Button>
              )}
            </View>
          </View>
        )}
      </Dialog.ScrollableInner>
    </>
  )
}
