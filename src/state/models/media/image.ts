import {Image as RNImage} from 'react-native-image-crop-picker'
import {RootStoreModel} from 'state/index'
import {getImageDim, resizeImage} from 'lib/media/manip'
import {makeAutoObservable, runInAction} from 'mobx'
import {openCropper} from 'lib/media/picker'
import {POST_IMG_MAX} from 'lib/constants'
import {scaleDownDimensions} from 'lib/media/util'

// TODO: EXIF embed
// Cases to consider: ExternalEmbed
export class ImageModel implements RNImage {
  path: string
  mime = 'image/jpeg'
  width: number
  height: number
  size: number
  cropped?: RNImage = undefined
  compressed?: RNImage = undefined
  scaledWidth: number = POST_IMG_MAX.width
  scaledHeight: number = POST_IMG_MAX.height

  constructor(public rootStore: RootStoreModel, image: RNImage) {
    makeAutoObservable(this, {
      rootStore: false,
    })

    this.path = image.path
    this.width = image.width
    this.height = image.height
    this.size = image.size
    this.getScaledDimensions()
  }

  getScaledDimensions() {
    const {width, height} = scaleDownDimensions(
      {width: this.width, height: this.height},
      POST_IMG_MAX,
    )

    this.scaledWidth = width
    this.scaledHeight = height
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
        width: this.scaledWidth,
        height: this.scaledHeight,
      })

      this.cropped = cropped
    } catch (err) {
      this.rootStore.log.error('Failed to crop photo', err)
    }

    runInAction(() => {
      this.compress()
    })
  }

  async compress() {
    try {
      const compressed = await resizeImage({
        ...(this.cropped === undefined ? this : this.cropped),
        width: this.scaledWidth,
        height: this.scaledHeight,
      })

      runInAction(() => {
        this.compressed = compressed
      })
    } catch (err) {
      this.rootStore.log.error('Failed to compress photo', err)
    }
  }
}
