import React from 'react'
import {Pressable, StyleSheet, Text} from 'react-native'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {useAvatar, useSetAvatar} from '#/screens/Onboarding/StepProfile/index'
import {useTheme} from '#/alf'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {openPicker} from 'lib/media/picker.shared'
import {openCropper} from 'lib/media/picker'

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
    const item = items[0]
    if (!item) return

    const croppedImage = await openCropper({
      mediaType: 'photo',
      cropperCircleOverlay: true,
      height: item.height,
      width: item.width,
      path: item.path,
    })

    setAvatar(prev => ({
      ...prev,
      image: croppedImage,
    }))
  }, [requestPhotoAccessIfNeeded, setAvatar])

  return (
    <>
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
      <Canvas />
    </>
  )
}

function Canvas() {
  const avatar = useAvatar()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {}, [])

  return (
    <canvas
      ref={canvasRef}
      height={1000}
      width={1000}
      style={{
        backgroundColor: avatar.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
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
