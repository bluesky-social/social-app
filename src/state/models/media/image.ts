import {POST_IMG_MAX} from 'lib/constants'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {RootStoreModel} from 'state/index'
import {getImageDim, resizeImage} from 'lib/media/manip'
import {makeAutoObservable, runInAction} from 'mobx'
import {openCropper} from 'lib/media/picker'

// TODO: EXIF embed
// Cases to consider: ExternalEmbed
export class ImageModel implements RNImage {
  path = ''
  width = POST_IMG_MAX.width
  height = POST_IMG_MAX.height
  size = POST_IMG_MAX.size
  mime = 'image/jpeg'
  cropped?: RNImage = undefined
  compressed?: RNImage = undefined

  constructor(public rootStore: RootStoreModel, image: RNImage) {
    makeAutoObservable(this, {
      rootStore: false,
    })

    this.path = image.path
  }

  async getDimensions() {
    try {
      const {height, width} = await getImageDim(this.path)

      runInAction(() => {
        this.height = height
        this.width = width
      })
    } catch (err) {
      this.rootStore.log.error('Failed to fetch image dimensions', err)
    }
  }

  async crop() {
    try {
      const cropped = await openCropper(this.rootStore, {
        mediaType: 'photo',
        path: this.path,
        freeStyleCropEnabled: true,
      })

      this.cropped = cropped
    } catch (err) {
      this.rootStore.log.error('Failed to crop photo', err)
    }

    runInAction(async () => {
      await this.compress()
    })
  }

  async compress() {
    if (this.size < POST_IMG_MAX.size) {
      return
    }

    try {
      const compressed = await resizeImage(
        this.cropped === undefined ? this : this.cropped,
      )

      runInAction(() => {
        this.compressed = compressed
      })
    } catch (err) {
      this.rootStore.log.error('Failed to compress photo', err)
    }
  }
}
