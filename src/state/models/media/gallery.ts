import {makeAutoObservable, runInAction} from 'mobx'

import {getImageDim} from 'lib/media/manip'
import {openPicker} from 'lib/media/picker'
import {ImageInitOptions, ImageModel} from './image'

interface InitialImageUri {
  uri: string
  width: number
  height: number
  altText?: string
}

export class GalleryModel {
  images: ImageModel[] = []

  constructor(uris?: InitialImageUri[]) {
    makeAutoObservable(this)

    if (uris) {
      this.addFromUris(uris)
    }
  }

  get isEmpty() {
    return this.size === 0
  }

  get size() {
    return this.images.length
  }

  get needsAltText() {
    return this.images.some(image => image.altText.trim() === '')
  }

  *add(image_: ImageInitOptions) {
    if (this.size >= 4) {
      return
    }

    // Temporarily enforce uniqueness but can eventually also use index
    if (!this.images.some(i => i.path === image_.path)) {
      const image = new ImageModel(image_)

      // Initial resize
      image.manipulate({})
      this.images.push(image)
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
    const images = await openPicker({
      selectionLimit: 4 - this.size,
      allowsMultipleSelection: true,
    })

    return await Promise.all(
      images.map(image => {
        this.add(image)
      }),
    )
  }

  async addFromUris(uris: InitialImageUri[]) {
    for (const uriObj of uris) {
      this.add({
        height: uriObj.height,
        width: uriObj.width,
        path: uriObj.uri,
        altText: uriObj.altText,
      })
    }
  }
}
