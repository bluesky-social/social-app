import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyGraphDefs, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {makeStarterPackLink} from 'lib/routes/links'
import {shareUrl} from 'lib/sharing'
import {logEvent} from 'lib/statsig/statsig'
import {getStarterPackOgCard} from 'lib/strings/starter-pack'
import {isWeb} from 'platform/detection'
import {useShortenLink} from 'state/queries/shorten-link'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {DialogControlProps} from '#/components/Dialog'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'

export function ShareDialog({
  starterPack,
  control,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  control: DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <ShareDialogInner starterPack={starterPack} control={control} />
    </Dialog.Outer>
  )
}

function ShareDialogInner({
  starterPack,
  control,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  control: DialogControlProps
}) {
  const {_} = useLingui()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const shortenLink = useShortenLink()
  const rkey = new AtUri(starterPack.uri).rkey

  const imageUrl = getStarterPackOgCard(starterPack)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [link, setLink] = React.useState<string>()

  React.useEffect(() => {
    ;(async () => {
      await Image.prefetch([imageUrl])
      setImageLoaded(true)
    })()
    ;(async () => {
      const res = await shortenLink(
        makeStarterPackLink(starterPack.creator.did, rkey),
      )
      setLink(res.url)
    })()
  }, [imageUrl, starterPack, shortenLink, rkey])

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
        <View style={[!isTabletOrDesktop && a.gap_lg]}>
          {!imageLoaded ? (
            <View style={[a.p_xl, a.align_center]}>
              <Loader size="xl" />
            </View>
          ) : null}

          {imageLoaded ? (
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
          ) : null}

          {imageLoaded && !link ? (
            <View style={[a.p_md, a.align_center]}>
              <Loader size="xl" />
            </View>
          ) : null}

          {link ? (
            <Button
              label="Share link"
              variant="solid"
              color="primary"
              size="small"
              style={[isWeb && a.self_center]}
              onPress={onShareLink}>
              <ButtonText>
                {isWeb ? <Trans>Copy Link</Trans> : <Trans>Share Link</Trans>}
              </ButtonText>
            </Button>
          ) : null}
        </View>
      </Dialog.ScrollableInner>
    </>
  )
}
