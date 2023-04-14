import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from 'state/index'
import {ImageModel} from './image'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {POST_IMG_MAX} from 'lib/constants'
import {openPicker} from 'lib/media/picker'

export class GalleryModel {
  images: ImageModel[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
    })
  }

  get isEmpty() {
    return this.size === 0
  }

  get size() {
    return this.images.length
  }

  get paths() {
    return this.images.map(image =>
      image.compressed === undefined ? image.path : image.compressed.path,
    )
  }

  async add(image_: RNImage) {
    if (this.size >= 4) {
      return
    }

    // Temporarily enforce uniqueness but can eventually also use index
    if (!this.images.some(i => i.path === image_.path)) {
      const image = new ImageModel(this.rootStore, image_)
      await image.compress()

      runInAction(() => {
        this.images.push(image)
      })
    }
  }

  async paste(uri: string) {
    const image = {
      path: uri,
      height: POST_IMG_MAX.height,
      width: POST_IMG_MAX.width,
      size: POST_IMG_MAX.size,
      mime: 'image/jpeg',
    }

    this.add(image)
  }

  crop(image: ImageModel) {
    image.crop()
  }

  remove(image: ImageModel) {
    const index = this.images.findIndex(image_ => image_.path === image.path)
    this.images.splice(index, 1)
  }

  async pick() {
    const images = await openPicker(this.rootStore, {
      multiple: true,
      maxFiles: 4 - this.images.length,
    })

    runInAction(() => {
      for (let image_ of images) {
        this.add(image_)
      }
    })
  }
}
