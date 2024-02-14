import React from 'react'
import {Pressable, StyleSheet} from 'react-native'
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

  React.useEffect(() => {
    // @ts-ignore web only
    const path = new Path2D(avatar.placeholder.path)
    // @ts-ignore web only
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.reset()
    ctx.fillStyle = avatar.backgroundColor
    ctx?.moveTo(0, 0)
    ctx?.fillRect(0, 0, 24 * 10, 24 * 10)
    ctx.fillStyle = '#fff'
    ctx.lineWidth = 0.1
    ctx?.translate(24 * 1.5, 24 * 1.5)
    ctx?.scale(7, 7)
    ctx?.fill(path)
  }, [avatar.backgroundColor, avatar.placeholder.path])

  return <canvas ref={canvasRef} height={24 * 10} width={24 * 10} />
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
