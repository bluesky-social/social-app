import React, {useCallback} from 'react'
import {TouchableOpacity, StyleSheet} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {isDesktopWeb} from 'platform/detection'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {GalleryModel} from 'state/models/media/gallery'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

type Props = {
  gallery: GalleryModel
}

export function SelectPhotoBtn({gallery}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const onPressSelectPhotos = useCallback(async () => {
    track('Composer:GalleryOpened')

    if (!isDesktopWeb && !(await requestPhotoAccessIfNeeded())) {
      return
    }

    gallery.pick()
  }, [track, gallery, requestPhotoAccessIfNeeded])

  return (
    <TouchableOpacity
      testID="openGalleryBtn"
      onPress={onPressSelectPhotos}
      style={styles.button}
      hitSlop={HITSLOP}
      accessibilityRole="button"
      accessibilityLabel="Gallery"
      accessibilityHint="Opens device photo gallery">
      <FontAwesomeIcon
        icon={['far', 'image']}
        style={pal.link as FontAwesomeIconStyle}
        size={24}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
  },
})
