import React, {useCallback, useState} from 'react'
import {Keyboard, Pressable, View} from 'react-native'
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
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {MAX_IMAGES} from '#/view/com/composer/state/composer'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Camera_Stroke2_Corner0_Rounded as CameraIcon} from '#/components/icons/Camera'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export function ComposerPrompt() {
  const {_} = useLingui()
  const t = useTheme()
  const {openComposer} = useOpenComposer()
  const profile = useCurrentAccountProfile()
  const [hover, setHover] = useState(false)
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const sheetWrapper = useSheetWrapper()

  const onPress = React.useCallback(() => {
    logger.metric('composerPrompt:press', {})
    openComposer({})
  }, [openComposer])

  const onPressImage = useCallback(async () => {
    logger.metric('composerPrompt:gallery:press', {})

    // On web, open the composer with the gallery picker auto-opening
    if (!isNative) {
      openComposer({openGallery: true})
      return
    }

    try {
      const [photoAccess, videoAccess] = await Promise.all([
        requestPhotoAccessIfNeeded(),
        requestVideoAccessIfNeeded(),
      ])

      if (!photoAccess && !videoAccess) {
        return
      }

      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
      }

      const selectionCountRemaining = MAX_IMAGES
      const {assets, canceled} = await sheetWrapper(
        openUnifiedPicker({selectionCountRemaining}),
      )

      if (canceled) {
        return
      }

      if (assets.length > 0) {
        const imageUris = assets
          .filter(asset => asset.mimeType?.startsWith('image/'))
          .slice(0, MAX_IMAGES)
          .map(asset => ({
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
          }))

        if (imageUris.length > 0) {
          openComposer({imageUris})
        }
      }
    } catch (err: any) {
      if (!String(err).toLowerCase().includes('cancel')) {
        logger.warn('Error opening image picker', {error: err})
      }
    }
  }, [
    openComposer,
    requestPhotoAccessIfNeeded,
    requestVideoAccessIfNeeded,
    sheetWrapper,
  ])

  const onPressCamera = useCallback(async () => {
    logger.metric('composerPrompt:camera:press', {})

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

      const imageUris = [
        {
          uri: image.path,
          width: image.width,
          height: image.height,
        },
      ]

      openComposer({
        imageUris: isNative ? imageUris : undefined,
      })
    } catch (err: any) {
      if (!String(err).toLowerCase().includes('cancel')) {
        logger.warn('Error opening camera', {error: err})
      }
    }
  }, [openComposer, requestCameraAccessIfNeeded])

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
        a.border_t,
        t.atoms.border_contrast_low,
        {
          paddingLeft: 18,
          paddingRight: 15,
        },
        a.py_md,
        native({
          paddingTop: 10,
          paddingBottom: 10,
        }),
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
            a.justify_between,
            a.px_md,
            a.rounded_full,
            t.atoms.bg_contrast_50,
            {
              height: 40,
            },
          ]}>
          <Text
            style={[
              t.atoms.text_contrast_low,
              a.text_md,
              a.pl_xs,
              {
                includeFontPadding: false,
              },
            ]}>
            {_(msg`What's up?`)}
          </Text>
          <View style={[a.flex_row, a.gap_md, a.mr_xs]}>
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
                {({hovered}) => (
                  <CameraIcon
                    size="md"
                    style={{
                      color: hovered
                        ? t.palette.primary_500
                        : t.palette.contrast_300,
                    }}
                  />
                )}
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
                  size="md"
                  style={{
                    color: hovered
                      ? t.palette.primary_500
                      : t.palette.contrast_300,
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
