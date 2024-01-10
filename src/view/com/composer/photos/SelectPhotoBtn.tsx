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
import {isNative} from 'platform/detection'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

type Props = {
  gallery: GalleryModel
}

export function SelectPhotoBtn({gallery}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const onPressSelectPhotos = useCallback(async () => {
    track('Composer:GalleryOpened')

    if (isNative && !(await requestPhotoAccessIfNeeded())) {
      return
    }

    gallery.pick()
  }, [track, requestPhotoAccessIfNeeded, gallery])

  return (
    <TouchableOpacity
      testID="openGalleryBtn"
      onPress={onPressSelectPhotos}
      style={styles.button}
      hitSlop={HITSLOP_10}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Gallery`)}
      accessibilityHint={_(msg`Opens device photo gallery`)}>
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
