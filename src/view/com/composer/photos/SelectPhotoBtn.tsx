import React from 'react'
import {Platform, TouchableOpacity} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {isDesktopWeb} from 'platform/detection'
import {openPicker, cropAndCompressFlow, pickImagesFlow} from 'lib/media/picker'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {
  POST_IMG_MAX_WIDTH,
  POST_IMG_MAX_HEIGHT,
  POST_IMG_MAX_SIZE,
} from 'lib/constants'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export function SelectPhotoBtn({
  enabled,
  selectedPhotos,
  onSelectPhotos,
}: {
  enabled: boolean
  selectedPhotos: string[]
  onSelectPhotos: (v: string[]) => void
}) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const store = useStores()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const onPressSelectPhotos = React.useCallback(async () => {
    track('Composer:GalleryOpened')
    if (!enabled) {
      return
    }
    if (isDesktopWeb) {
      const images = await pickImagesFlow(
        store,
        4 - selectedPhotos.length,
        {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
        POST_IMG_MAX_SIZE,
      )
      onSelectPhotos([...selectedPhotos, ...images])
    } else {
      if (!(await requestPhotoAccessIfNeeded())) {
        return
      }
      const items = await openPicker(store, {
        multiple: true,
        maxFiles: 4 - selectedPhotos.length,
        mediaType: 'photo',
      })
      const result = []
      for (const image of items) {
        if (Platform.OS === 'android') {
          result.push(image.path)
          continue
        }
        result.push(
          await cropAndCompressFlow(
            store,
            image.path,
            image,
            {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
            POST_IMG_MAX_SIZE,
          ),
        )
      }
      onSelectPhotos([...selectedPhotos, ...result])
    }
  }, [
    track,
    store,
    onSelectPhotos,
    selectedPhotos,
    enabled,
    requestPhotoAccessIfNeeded,
  ])

  return (
    <TouchableOpacity
      testID="openGalleryBtn"
      onPress={onPressSelectPhotos}
      style={[s.pl5, s.pr20]}
      hitSlop={HITSLOP}>
      <FontAwesomeIcon
        icon={['far', 'image']}
        style={
          (enabled
            ? pal.link
            : [pal.textLight, s.dimmed]) as FontAwesomeIconStyle
        }
        size={24}
      />
    </TouchableOpacity>
  )
}
