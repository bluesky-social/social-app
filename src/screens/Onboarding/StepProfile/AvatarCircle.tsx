import React from 'react'
import {LayoutAnimation, Pressable, PressableProps, View} from 'react-native'
import {Image} from 'expo-image'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {useAvatar, useSetAvatar} from '#/screens/Onboarding/StepProfile/index'

import {atoms as a, useTheme} from '#/alf'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {openPicker} from 'lib/media/picker.shared'
import {isNative, isWeb} from 'platform/detection'
import {openCropper} from 'lib/media/picker'
import {compressIfNeeded} from 'lib/media/manip'

export function AvatarBottomButton({...props}: PressableProps) {
  const t = useTheme()

  return (
    <Pressable
      {...props}
      style={[
        a.absolute,
        a.rounded_full,
        a.align_center,
        a.justify_center,
        t.name === 'light' ? t.atoms.bg_contrast_800 : t.atoms.bg_contrast_200,
        {height: 48, width: 48, bottom: 2, right: 2},
      ]}>
      {props.children}
    </Pressable>
  )
}

export function AvatarCircle() {
  const t = useTheme()
  const avatar = useAvatar()
  const setAvatar = useSetAvatar()
  const Icon = avatar.placeholder.component
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const styles = React.useMemo(
    () => ({
      imageContainer: [
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        t.atoms.border_contrast_high,
        {
          height: 150,
          width: 150,
          borderWidth: 2,
          backgroundColor: avatar.backgroundColor,
        },
      ],
    }),
    [avatar.backgroundColor, t.atoms.border_contrast_high],
  )

  const onCameraPress = React.useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }

    const items = await openPicker({
      aspect: [1, 1],
    })
    let image = items[0]
    if (!image) return

    // TODO we need an alf modal for the cropper
    if (!isWeb) {
      image = await openCropper({
        mediaType: 'photo',
        cropperCircleOverlay: true,
        height: image.height,
        width: image.width,
        path: image.path,
      })
    }
    image = await compressIfNeeded(image, 1000000)

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    // If we are on mobile, prefetching the image will load the image into memory before we try and display it,
    // stopping any brief flickers.
    if (isNative) {
      await Image.prefetch(image.path)
    }

    setAvatar(prev => ({
      ...prev,
      image,
    }))
  }, [requestPhotoAccessIfNeeded, setAvatar])

  const onPressRemoveAvatar = React.useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setAvatar(prev => ({
      ...prev,
      image: undefined,
    }))
  }, [setAvatar])

  if (avatar.image) {
    return (
      <View>
        <Image
          source={avatar.image.path}
          style={styles.imageContainer}
          accessibilityIgnoresInvertColors
        />
        <AvatarBottomButton onPress={onPressRemoveAvatar}>
          <Times size="lg" style={{color: t.palette.white}} />
        </AvatarBottomButton>
      </View>
    )
  }

  return (
    <View>
      <View style={styles.imageContainer}>
        <Icon height={85} width={85} style={{color: t.palette.white}} />
      </View>
      <AvatarBottomButton onPress={onCameraPress}>
        <Camera size="xl" style={{color: t.palette.white}} />
      </AvatarBottomButton>
    </View>
  )
}
