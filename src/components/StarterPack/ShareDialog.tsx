import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {shareUrl} from 'lib/sharing'
import {logEvent} from 'lib/statsig/statsig'
import {getStarterPackOgCard} from 'lib/strings/starter-pack'
import {isWeb} from 'platform/detection'
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

  return (
    <>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Share link dialog`)}>
        {!imageLoaded || !link ? (
          <View style={[a.p_xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : (
          <View style={[!isTabletOrDesktop && a.gap_lg]}>
            <View style={[a.gap_sm]}>
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
            <Button
              label="Share link"
              variant="solid"
              color="secondary"
              size="small"
              style={[isWeb && a.self_center]}
              onPress={onShareLink}>
              <ButtonText>
                {isWeb ? <Trans>Copy Link</Trans> : <Trans>Share Link</Trans>}
              </ButtonText>
            </Button>
            <Button
              label="Create QR code"
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
                <Trans>Create QR code</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </Dialog.ScrollableInner>
    </>
  )
}
