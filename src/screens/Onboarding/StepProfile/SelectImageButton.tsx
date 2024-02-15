import React from 'react'
import {LayoutAnimation, Pressable, StyleSheet} from 'react-native'
import {Image} from 'expo-image'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {useSetAvatar} from '#/screens/Onboarding/StepProfile/index'
import {atoms as a, useTheme} from '#/alf'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {openPicker} from 'lib/media/picker.shared'
import {openCropper} from 'lib/media/picker'
import {compressIfNeeded} from 'lib/media/manip'
import {isNative, isWeb} from 'platform/detection'
import Animated from 'react-native-reanimated'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export function SelectImageButton() {
  const t = useTheme()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const setAvatar = useSetAvatar()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

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

  return (
    <Animated.View
      style={[
        styles.imageContainer,
        styles.paletteContainer,
        a.mr_2xl,
        t.atoms.border_contrast_high,
        {height: 70, width: 70, marginRight: isTabletOrDesktop ? 0 : 5},
      ]}>
      <Pressable
        accessibilityRole="button"
        onPress={onCameraPress}
        style={[a.flex_1, a.align_center, a.justify_center]}>
        <Camera height={40} width={40} style={[t.atoms.text_contrast_medium]} />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 100,
    borderWidth: 2,
    height: 150,
    width: 150,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteContainer: {
    height: 70,
    width: 70,
  },
})
