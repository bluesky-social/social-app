import {Image as RNImage} from 'react-native-image-crop-picker'
import {makeAutoObservable} from 'mobx'
import {POST_IMG_MAX} from 'lib/constants'
import {ActionCrop} from 'expo-image-manipulator'
import {Position} from 'react-avatar-editor'
import {Dimensions} from 'lib/media/types'

export interface ImageManipulationAttributes {
  aspectRatio?: '4:3' | '1:1' | '3:4' | 'None'
  rotate?: number
  scale?: number
  position?: Position
  flipHorizontal?: boolean
  flipVertical?: boolean
}

export class ImageModel implements Omit<RNImage, 'size'> {
  path: string
  mime = 'image/jpeg'
  width: number
  height: number
  altText = ''
  cropped?: RNImage = undefined
  compressed?: RNImage = undefined

  // Web manipulation
  prev?: RNImage
  attributes: ImageManipulationAttributes = {
    aspectRatio: 'None',
    scale: 1,
    flipHorizontal: false,
    flipVertical: false,
    rotate: 0,
  }
  prevAttributes: ImageManipulationAttributes = {}

  constructor(image: Omit<RNImage, 'size'>) {
    makeAutoObservable(this)

    this.path = image.path
    this.width = image.width
    this.height = image.height
  }

  setRatio(aspectRatio: ImageManipulationAttributes['aspectRatio']) {
    this.attributes.aspectRatio = aspectRatio
  }

  setRotate(degrees: number) {
    this.attributes.rotate = degrees
    this.manipulate({})
  }

  flipVertical() {
    this.attributes.flipVertical = !this.attributes.flipVertical
    this.manipulate({})
  }

  flipHorizontal() {
    this.attributes.flipHorizontal = !this.attributes.flipHorizontal
    this.manipulate({})
  }

  get ratioMultipliers() {
    return {
      '4:3': 4 / 3,
      '1:1': 1,
      '3:4': 3 / 4,
      None: this.width / this.height,
    }
  }

  getUploadDimensions(
    dimensions: Dimensions,
    maxDimensions: Dimensions = POST_IMG_MAX,
    as: ImageManipulationAttributes['aspectRatio'] = 'None',
  ) {
    const {width, height} = dimensions
    const {width: maxWidth, height: maxHeight} = maxDimensions

    return width < maxWidth && height < maxHeight
      ? {
          width,
          height,
        }
      : this.getResizedDimensions(as, POST_IMG_MAX.width)
  }

  getResizedDimensions(
    as: ImageManipulationAttributes['aspectRatio'] = 'None',
    maxSide: number,
  ) {
    const ratioMultiplier = this.ratioMultipliers[as]

    if (ratioMultiplier === 1) {
      return {
        height: maxSide,
        width: maxSide,
      }
    }

    if (ratioMultiplier < 1) {
      return {
        width: maxSide * ratioMultiplier,
        height: maxSide,
      }
    }

    return {
      width: maxSide,
      height: maxSide / ratioMultiplier,
    }
  }

  setAltText(altText: string) {
    this.altText = altText.trim()
  }

  // Only compress prior to upload
  async compress() {
    // do nothing
  }

  // Mobile
  async crop() {
    // do nothing
  }

  // Web manipulation
  async manipulate(
    _attributes: {
      crop?: ActionCrop['crop']
    } & ImageManipulationAttributes,
  ) {
    // do nothing
  }

  resetCropped() {
    this.manipulate({})
  }

  previous() {
    this.cropped = this.prev
    this.attributes = this.prevAttributes
  }
}
