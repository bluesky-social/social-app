import React, {useCallback} from 'react'
import {TouchableOpacity, StyleSheet} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {GalleryModel} from 'state/models/media/gallery'
import {HITSLOP_10} from 'lib/constants'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

type Props = {
  gallery: GalleryModel
}

export function SelectPhotoBtn({gallery}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {isDesktop} = useWebMediaQueries()

  const onPressSelectPhotos = useCallback(async () => {
    track('Composer:GalleryOpened')

    if (!isDesktop && !(await requestPhotoAccessIfNeeded())) {
      return
    }

    gallery.pick()
  }, [track, isDesktop, requestPhotoAccessIfNeeded, gallery])

  return (
    <TouchableOpacity
      testID="openGalleryBtn"
      onPress={onPressSelectPhotos}
      style={styles.button}
      hitSlop={HITSLOP_10}
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
