import React, {useCallback, useState} from 'react'
import {Keyboard, Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {
  useCameraPermission,
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {openCamera, openUnifiedPicker} from '#/lib/media/picker'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {createComposerImage} from '#/state/gallery'
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useComposerControls} from '#/state/shell/composer'
import {MAX_IMAGES} from '#/view/com/composer/state/composer'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Camera_Stroke2_Corner0_Rounded as CameraIcon} from '#/components/icons/Camera'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export function FeedComposerPrompt() {
  const {_} = useLingui()
  const t = useTheme()
  const {openComposer} = useOpenComposer()
  const {closeComposer} = useComposerControls()
  const profile = useCurrentAccountProfile()
  const [hover, setHover] = useState(false)
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const sheetWrapper = useSheetWrapper()

  const onPress = React.useCallback(() => {
    logger.metric('postComposer:click', {})
    openComposer({})
  }, [openComposer])

  const onPressImage = useCallback(async () => {
    logger.metric('postComposer:click', {})

    // Open the composer first so it's ready
    openComposer({})

    // Use a small delay to ensure composer starts rendering before opening picker
    setTimeout(async () => {
      try {
        if (isNative) {
          const [photoAccess, videoAccess] = await Promise.all([
            requestPhotoAccessIfNeeded(),
            requestVideoAccessIfNeeded(),
          ])

          if (!photoAccess && !videoAccess) {
            return
          }
        }

        if (isNative && Keyboard.isVisible()) {
          Keyboard.dismiss()
        }

        const selectionCountRemaining = MAX_IMAGES
        const {assets, canceled} = await sheetWrapper(
          openUnifiedPicker({selectionCountRemaining}),
        )

        if (canceled) return

        if (assets.length > 0) {
          // Process images and add them to the composer
          const images = await Promise.all(
            assets
              .filter(asset => asset.mimeType?.startsWith('image/'))
              .slice(0, MAX_IMAGES)
              .map(async image => {
                try {
                  return await createComposerImage({
                    path: image.uri,
                    width: image.width,
                    height: image.height,
                    mime: image.mimeType!,
                  })
                } catch (e) {
                  logger.error(`createComposerImage failed`, {
                    safeMessage: e instanceof Error ? e.message : String(e),
                  })
                  return null
                }
              }),
          )

          const validImages = images.filter(
            (img): img is NonNullable<typeof img> => img !== null,
          )

          if (validImages.length > 0) {
            // Convert to imageUris format for the composer
            // createComposerImage returns ComposerImageWithoutTransformation which always has source
            const imageUris = validImages.map(img => {
              const source = img.source
              return {
                uri: source.path,
                width: source.width,
                height: source.height,
                altText: img.alt,
              }
            })

            // Close the composer first (if it was opened), then reopen with images
            // This ensures the composer state is reset and can accept the new imageUris
            closeComposer()
            // Wait a bit for the picker to fully close and composer to close, then reopen with images
            // This follows the same pattern as useIntentHandler
            setTimeout(() => {
              openComposer({
                imageUris: isNative ? imageUris : undefined,
              })
            }, 100)
          }
        }
      } catch (err: any) {
        if (!String(err).toLowerCase().includes('cancel')) {
          logger.warn('Error opening image picker', {error: err})
        }
      }
    }, 100)
  }, [
    openComposer,
    closeComposer,
    requestPhotoAccessIfNeeded,
    requestVideoAccessIfNeeded,
    sheetWrapper,
  ])

  const onPressCamera = useCallback(async () => {
    logger.metric('postComposer:click', {})

    // Open the composer first so it's ready
    openComposer({})

    // Use a small delay to ensure composer starts rendering before opening camera
    setTimeout(async () => {
      try {
        if (!(await requestCameraAccessIfNeeded())) {
          return
        }

        if (isNative && Keyboard.isVisible()) {
          Keyboard.dismiss()
        }

        const image = await openCamera({
          mediaTypes: 'images',
        })

        // Process the image
        try {
          const composerImage = await createComposerImage({
            path: image.path,
            width: image.width,
            height: image.height,
            mime: image.mime,
          })

          // Convert to imageUris format for the composer
          const source = composerImage.source
          const imageUris = [
            {
              uri: source.path,
              width: source.width,
              height: source.height,
              altText: composerImage.alt,
            },
          ]

          // Close the composer first (if it was opened), then reopen with image
          closeComposer()
          setTimeout(() => {
            openComposer({
              imageUris: isNative ? imageUris : undefined,
            })
          }, 100)
        } catch (e) {
          logger.error(`createComposerImage failed`, {
            safeMessage: e instanceof Error ? e.message : String(e),
          })
        }
      } catch (err: any) {
        if (!String(err).toLowerCase().includes('cancel')) {
          logger.warn('Error opening camera', {error: err})
        }
      }
    }, 100)
  }, [openComposer, closeComposer, requestCameraAccessIfNeeded])

  if (!profile) {
    return null
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Compose new post`)}
      accessibilityHint={_(msg`Opens the post composer`)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={({pressed}) => [
        a.relative,
        a.flex_row,
        a.align_start,
        {
          paddingLeft: 18,
          paddingRight: 15,
        },
        a.py_md,
        native({
          paddingTop: 15,
          paddingBottom: 15,
        }),
        {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: t.atoms.border_contrast_low.borderColor,
        },
        web({
          cursor: 'pointer',
          outline: 'none',
        }),
        pressed && web({outline: 'none'}),
      ]}>
      <SubtleHover hover={hover} />
      <UserAvatar
        avatar={profile.avatar}
        size={40}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
      />
      <View style={[a.flex_1, a.ml_md, a.flex_row, a.align_center, a.gap_xs]}>
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.px_md,
            {
              height: 40,
              borderRadius: 20,
              justifyContent: 'space-between',
            },
            t.atoms.bg_contrast_50,
          ]}>
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.text_md,
              {
                lineHeight: a.text_md.fontSize,
                includeFontPadding: false,
              },
            ]}>
            {_(msg`What's up?`)}
          </Text>
          <View style={[a.flex_row, a.gap_xs]}>
            {isNative && (
              <Button
                onPress={e => {
                  e.stopPropagation()
                  onPressCamera()
                }}
                label={_(msg`Open camera`)}
                accessibilityHint={_(msg`Opens device camera`)}
                variant="ghost"
                shape="round">
                <CameraIcon size="lg" />
              </Button>
            )}
            <Button
              onPress={e => {
                e.stopPropagation()
                onPressImage()
              }}
              label={_(msg`Add image`)}
              accessibilityHint={_(msg`Opens image picker`)}
              variant="ghost"
              shape="round">
              {({hovered}) => (
                <ImageIcon
                  size="lg"
                  style={{
                    color: hovered
                      ? t.palette.primary_500
                      : t.palette.contrast_400,
                  }}
                />
              )}
            </Button>
          </View>
        </View>
      </View>
    </Pressable>
  )
}
