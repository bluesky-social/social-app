import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from 'state/index'
import {ImageModel} from './image'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {openPicker} from 'lib/media/picker'
import {getImageDim} from 'lib/media/manip'
import {isNative} from 'platform/detection'

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

  async add(image_: Omit<RNImage, 'size'>) {
    if (this.size >= 4) {
      return
    }

    // Temporarily enforce uniqueness but can eventually also use index
    if (!this.images.some(i => i.path === image_.path)) {
      const image = new ImageModel(this.rootStore, image_)

      // Initial resize
      image.manipulate({})
      this.images.push(image)
    }
  }

  async edit(image: ImageModel) {
    if (isNative) {
      this.crop(image)
    } else {
      this.rootStore.shell.openModal({
        name: 'edit-image',
        image,
        gallery: this,
      })
    }
  }

  async paste(uri: string) {
    if (this.size >= 4) {
      return
    }

    const {width, height} = await getImageDim(uri)

    const image = {
      path: uri,
      height,
      width,
      mime: 'image/jpeg',
    }

    runInAction(() => {
      this.add(image)
    })
  }

  setAltText(image: ImageModel, altText: string) {
    image.setAltText(altText)
  }

  crop(image: ImageModel) {
    image.crop()
  }

  remove(image: ImageModel) {
    const index = this.images.findIndex(image_ => image_.path === image.path)
    this.images.splice(index, 1)
  }

  async previous(image: ImageModel) {
    image.previous()
  }

  async pick() {
    const images = await openPicker(this.rootStore, {
      selectionLimit: 4 - this.size,
      allowsMultipleSelection: true,
    })

    return await Promise.all(
      images.map(image => {
        this.add(image)
      }),
    )
  }
}
