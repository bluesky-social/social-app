import React from 'react'
import {LayoutAnimation, Pressable, StyleSheet} from 'react-native'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {useSetAvatar} from '#/screens/Onboarding/StepProfile/index'
import {useTheme} from '#/alf'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {openPicker} from 'lib/media/picker.shared'
import {openCropper} from 'lib/media/picker'
import {compressIfNeeded} from 'lib/media/manip'
import {isWeb} from 'platform/detection'

export function SelectImageButton() {
  const t = useTheme()
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
    image = await compressIfNeeded(image)

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setAvatar(prev => ({
      ...prev,
      image,
    }))
  }, [requestPhotoAccessIfNeeded, setAvatar])

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.imageContainer,
        styles.paletteContainer,
        t.atoms.border_contrast_high,
      ]}
      onPress={onCameraPress}>
      <Camera size="xl" style={[t.atoms.text_contrast_medium]} />
    </Pressable>
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
    height: 80,
    width: 80,
    marginHorizontal: 5,
  },
  flatListOuter: {
    height: 100,
  },
  flatListContainer: {
    paddingLeft: 40,
    paddingRight: 40,
  },
})
