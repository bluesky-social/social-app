import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Dispatch, SetStateAction, useCallback} from 'react'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {isDesktopWeb} from 'platform/detection'
import {openPicker} from 'lib/media/picker'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {SelectedPhoto} from 'lib/media/types'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

type Props = {
  enabled: boolean
  selectedPhotos: SelectedPhoto[]
  setSelectedPhotos: Dispatch<SetStateAction<SelectedPhoto[]>>
}

export function SelectPhotoBtn({
  enabled,
  selectedPhotos,
  setSelectedPhotos,
}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const store = useStores()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const onPressSelectPhotos = useCallback(async () => {
    track('Composer:GalleryOpened')

    if (!enabled) {
      return
    }

    if (!isDesktopWeb && !(await requestPhotoAccessIfNeeded())) {
      return
    }

    const images = await openPicker(store, {
      multiple: true,
      maxFiles: 4 - selectedPhotos.length,
      mediaType: 'photo',
    })

    setSelectedPhotos(prevPhotos => [
      ...prevPhotos,
      ...images.map(image => ({
        original: image,
      })),
    ])
  }, [
    track,
    store,
    selectedPhotos,
    setSelectedPhotos,
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
