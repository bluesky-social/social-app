import {Image as RNImage} from 'react-native-image-crop-picker'
import {RootStoreModel} from 'state/index'
import {makeAutoObservable, runInAction} from 'mobx'
import {POST_IMG_MAX} from 'lib/constants'
import * as ImageManipulator from 'expo-image-manipulator'
import {getDataUriSize, scaleDownDimensions} from 'lib/media/util'
import {openCropper} from 'lib/media/picker'
import {ActionCrop, FlipType, SaveFormat} from 'expo-image-manipulator'
import {Position} from 'react-avatar-editor'
import {compressAndResizeImageForPost} from 'lib/media/manip'

// TODO: EXIF embed
// Cases to consider: ExternalEmbed

export interface ImageManipulationAttributes {
  aspectRatio?: '4:3' | '1:1' | '3:4' | 'None'
  rotate?: number
  scale?: number
  position?: Position
  flipHorizontal?: boolean
  flipVertical?: boolean
}

export class ImageModel implements RNImage {
  path: string
  mime = 'image/jpeg'
  width: number
  height: number
  size: number
  altText = ''
  cropped?: RNImage = undefined
  compressed?: RNImage = undefined
  scaledWidth: number = POST_IMG_MAX.width
  scaledHeight: number = POST_IMG_MAX.height

  // Web manipulation
  prev?: RNImage
  attributes: ImageManipulationAttributes = {
    aspectRatio: '1:1',
    scale: 1,
    flipHorizontal: false,
    flipVertical: false,
    rotate: 0,
  }
  prevAttributes: ImageManipulationAttributes = {}

  constructor(public rootStore: RootStoreModel, image: RNImage) {
    makeAutoObservable(this, {
      rootStore: false,
    })

    this.path = image.path
    this.width = image.width
    this.height = image.height
    this.size = image.size
    this.calcScaledDimensions()
  }

  // TODO: Revisit compression factor due to updated sizing with zoom
  // get compressionFactor() {
  //   const MAX_IMAGE_SIZE_IN_BYTES = 976560

  //   return this.size < MAX_IMAGE_SIZE_IN_BYTES
  //     ? 1
  //     : MAX_IMAGE_SIZE_IN_BYTES / this.size
  // }

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

  getDisplayDimensions(
    as: ImageManipulationAttributes['aspectRatio'] = '1:1',
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

  calcScaledDimensions() {
    const {width, height} = scaleDownDimensions(
      {width: this.width, height: this.height},
      POST_IMG_MAX,
    )
    this.scaledWidth = width
    this.scaledHeight = height
  }

  async setAltText(altText: string) {
    this.altText = altText
  }

  // Only for mobile
  async crop() {
    try {
      const cropped = await openCropper(this.rootStore, {
        mediaType: 'photo',
        path: this.path,
        freeStyleCropEnabled: true,
        width: this.scaledWidth,
        height: this.scaledHeight,
      })
      runInAction(() => {
        this.cropped = cropped
        this.compress()
      })
    } catch (err) {
      this.rootStore.log.error('Failed to crop photo', err)
    }
  }

  async compress() {
    try {
      const {width, height} = scaleDownDimensions(
        this.cropped
          ? {width: this.cropped.width, height: this.cropped.height}
          : {width: this.width, height: this.height},
        POST_IMG_MAX,
      )

      // TODO: Revisit this - currently iOS uses this as well
      const compressed = await compressAndResizeImageForPost({
        ...(this.cropped === undefined ? this : this.cropped),
        width,
        height,
      })

      runInAction(() => {
        this.compressed = compressed
      })
    } catch (err) {
      this.rootStore.log.error('Failed to compress photo', err)
    }
  }

  // Web manipulation
  async manipulate(
    attributes: {
      crop?: ActionCrop['crop']
    } & ImageManipulationAttributes,
  ) {
    const {aspectRatio, crop, position, scale} = attributes
    const modifiers = []

    if (this.attributes.flipHorizontal) {
      modifiers.push({flip: FlipType.Horizontal})
    }

    if (this.attributes.flipVertical) {
      modifiers.push({flip: FlipType.Vertical})
    }

    if (this.attributes.rotate !== undefined) {
      modifiers.push({rotate: this.attributes.rotate})
    }

    if (crop !== undefined) {
      modifiers.push({
        crop: {
          originX: crop.originX * this.width,
          originY: crop.originY * this.height,
          height: crop.height * this.height,
          width: crop.width * this.width,
        },
      })
    }

    if (scale !== undefined) {
      this.attributes.scale = scale
    }

    if (position !== undefined) {
      this.attributes.position = position
    }

    if (aspectRatio !== undefined) {
      this.attributes.aspectRatio = aspectRatio
    }

    const ratioMultiplier =
      this.ratioMultipliers[this.attributes.aspectRatio ?? '1:1']

    const MAX_SIDE = 2000

    const result = await ImageManipulator.manipulateAsync(
      this.path,
      [
        ...modifiers,
        {resize: ratioMultiplier > 1 ? {width: MAX_SIDE} : {height: MAX_SIDE}},
      ],
      {
        compress: 0.9,
        format: SaveFormat.JPEG,
      },
    )

    runInAction(() => {
      this.compressed = {
        mime: 'image/jpeg',
        path: result.uri,
        size: getDataUriSize(result.uri),
        ...result,
      }
    })
  }

  resetCompressed() {
    this.manipulate({})
  }

  previous() {
    this.compressed = this.prev
    this.attributes = this.prevAttributes
  }
}
