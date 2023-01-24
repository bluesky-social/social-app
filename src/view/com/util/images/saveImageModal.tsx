import {ConfirmModal} from '../../../../state/models/shell-ui'
import {downloadImageToGallery} from '../../../../lib/images'
import * as Toast from '../Toast'

export const saveImageModal = ({uri}: {uri: string}) =>
  new ConfirmModal('Save Image?', 'Save this image to your device?', () => {
    downloadImageToGallery(uri)
    Toast.show('Image saved to gallery')
  })
