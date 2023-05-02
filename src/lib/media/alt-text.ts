import {RootStoreModel} from 'state/index'
import {ImageModel} from 'state/models/media/image'

export async function openAltTextModal(
  store: RootStoreModel,
  image: ImageModel,
) {
  store.shell.openModal({
    name: 'alt-text-image',
    image,
  })
}
