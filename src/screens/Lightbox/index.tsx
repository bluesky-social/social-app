import {useCallback, useRef} from 'react'
import {type NavigationAction, usePreventRemove} from '@react-navigation/native'

import {shareImageModal} from '#/lib/media/manip'
import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import ImageView from '#/components/Lightbox/pager/ImagePager'
import {useLightbox, useLightboxControls} from '#/components/Lightbox/state'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Lightbox'>

export function LightboxScreen({navigation}: Props) {
  const {activeLightbox} = useLightbox()
  const {closeLightbox} = useLightboxControls()
  const saveImageToAlbum = useSaveImageToMediaLibrary()
  const pendingAction = useRef<NavigationAction | null>(null)

  // Block the pop while the lightbox is still open. When a pop is attempted
  // (hardware back, programmatic goBack, etc.), start the close spring and
  // stash the action to replay once the animation completes.
  usePreventRemove(!!activeLightbox, ({data}) => {
    pendingAction.current = data.action
    closeLightbox()
  })

  const onRequestClose = useCallback(() => {
    closeLightbox()
  }, [closeLightbox])

  // Fires from ImageViewRoot once the openProgress spring reaches 0. By then
  // activeLightbox is already null, so usePreventRemove no longer blocks and
  // the stashed action (or a fresh goBack) pops the screen cleanly.
  const onAnimationEnd = useCallback(() => {
    const action = pendingAction.current
    pendingAction.current = null
    if (action) {
      navigation.dispatch(action)
    } else if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])

  return (
    <ImageView
      lightbox={activeLightbox}
      onRequestClose={onRequestClose}
      onAnimationEnd={onAnimationEnd}
      onPressSave={saveImageToAlbum}
      onPressShare={uri => shareImageModal({uri})}
    />
  )
}
