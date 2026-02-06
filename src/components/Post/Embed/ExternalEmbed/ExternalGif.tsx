import React from 'react'
import {
  ActivityIndicator,
  type GestureResponderEvent,
  Pressable,
} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type EmbedPlayerParams} from '#/lib/strings/embed-player'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {EmbedConsentDialog} from '#/components/dialogs/EmbedConsent'
import {Fill} from '#/components/Fill'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {IS_IOS, IS_NATIVE, IS_WEB} from '#/env'

export function ExternalGif({
  link,
  params,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
}) {
  const t = useTheme()
  const externalEmbedsPrefs = useExternalEmbedsPrefs()
  const {_} = useLingui()
  const consentDialogControl = useDialogControl()

  // Tracking if the placer has been activated
  const [isPlayerActive, setIsPlayerActive] = React.useState(false)
  // Tracking whether the gif has been loaded yet
  const [isPrefetched, setIsPrefetched] = React.useState(false)
  // Tracking whether the image is animating
  const [isAnimating, setIsAnimating] = React.useState(true)

  // Used for controlling animation
  const imageRef = React.useRef<Image>(null)

  const load = React.useCallback(() => {
    setIsPlayerActive(true)
    Image.prefetch(params.playerUri).then(() => {
      // Replace the image once it's fetched
      setIsPrefetched(true)
    })
  }, [params.playerUri])

  const onPlayPress = React.useCallback(
    (event: GestureResponderEvent) => {
      // Don't propagate on web
      event.preventDefault()

      // Show consent if this is the first load
      if (externalEmbedsPrefs?.[params.source] === undefined) {
        consentDialogControl.open()
        return
      }
      // If the player isn't active, we want to activate it and prefetch the gif
      if (!isPlayerActive) {
        load()
        return
      }
      // Control animation on native
      setIsAnimating(prev => {
        if (prev) {
          if (IS_NATIVE) {
            imageRef.current?.stopAnimating()
          }
          return false
        } else {
          if (IS_NATIVE) {
            imageRef.current?.startAnimating()
          }
          return true
        }
      })
    },
    [
      consentDialogControl,
      externalEmbedsPrefs,
      isPlayerActive,
      load,
      params.source,
    ],
  )

  return (
    <>
      <EmbedConsentDialog
        control={consentDialogControl}
        source={params.source}
        onAccept={load}
      />

      <Pressable
        style={[
          {height: 300},
          a.w_full,
          a.overflow_hidden,
          {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        ]}
        onPress={onPlayPress}
        accessibilityRole="button"
        accessibilityHint={_(msg`Plays the GIF`)}
        accessibilityLabel={_(msg`Play ${link.title}`)}>
        <Image
          source={{
            uri:
              !isPrefetched || (IS_WEB && !isAnimating)
                ? link.thumb
                : params.playerUri,
          }} // Web uses the thumb to control playback
          style={{flex: 1}}
          ref={imageRef}
          autoplay={isAnimating}
          contentFit="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel={link.title}
          accessibilityHint={link.title}
          cachePolicy={IS_IOS ? 'disk' : 'memory-disk'} // cant control playback with memory-disk on ios
        />

        {(!isPrefetched || !isAnimating) && (
          <Fill style={[a.align_center, a.justify_center]}>
            <Fill
              style={[
                t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                {
                  opacity: 0.3,
                },
              ]}
            />

            {!isAnimating || !isPlayerActive ? ( // Play button when not animating or not active
              <PlayButtonIcon />
            ) : (
              // Activity indicator while gif loads
              <ActivityIndicator size="large" color="white" />
            )}
          </Fill>
        )}
      </Pressable>
    </>
  )
}
