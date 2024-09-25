import {Image as RNImage} from 'react-native-image-crop-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import {ActionCrop, FlipType, SaveFormat} from 'expo-image-manipulator'
import {makeAutoObservable, runInAction} from 'mobx'
import {Position} from 'react-avatar-editor'

import {logger} from '#/logger'
import {POST_IMG_MAX} from 'lib/constants'
import {openCropper} from 'lib/media/picker'
import {Dimensions} from 'lib/media/types'
import {getDataUriSize} from 'lib/media/util'
import {isIOS} from 'platform/detection'

export interface ImageManipulationAttributes {
  aspectRatio?: '4:3' | '1:1' | '3:4' | 'None'
  rotate?: number
  scale?: number
  position?: Position
  flipHorizontal?: boolean
  flipVertical?: boolean
}

export interface ImageInitOptions {
  path: string
  width: number
  height: number
  altText?: string
}

const MAX_IMAGE_SIZE_IN_BYTES = 976560

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

  constructor(image: ImageInitOptions) {
    makeAutoObservable(this)

    this.path = image.path
    this.width = image.width
    this.height = image.height
    if (image.altText !== undefined) {
      this.setAltText(image.altText)
    }
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
    for (let i = 10; i > 0; i--) {
      // Float precision
      const factor = Math.round(i) / 10
      const compressed = await ImageManipulator.manipulateAsync(
        this.cropped?.path ?? this.path,
        undefined,
        {
          compress: factor,
          base64: true,
          format: SaveFormat.JPEG,
        },
      )

      if (compressed.base64 !== undefined) {
        const size = getDataUriSize(compressed.base64)

        if (size < MAX_IMAGE_SIZE_IN_BYTES) {
          runInAction(() => {
            this.compressed = {
              mime: 'image/jpeg',
              path: compressed.uri,
              size,
              ...compressed,
            }
          })
          return
        }
      }
    }

    // Compression fails when removing redundant information is not possible.
    // This can be tested with images that have high variance in noise.
    throw new Error('Failed to compress image')
  }

  // Mobile
  async crop() {
    try {
      // NOTE
      // on ios, react-native-image-crop-picker gives really bad quality
      // without specifying width and height. on android, however, the
      // crop stretches incorrectly if you do specify it. these are
      // both separate bugs in the library. we deal with that by
      // providing width & height for ios only
      // -prf
      const {width, height} = this.getUploadDimensions({
        width: this.width,
        height: this.height,
      })

      const cropped = await openCropper({
        mediaType: 'photo',
        path: this.path,
        freeStyleCropEnabled: true,
        ...(isIOS ? {width, height} : {}),
      })

      runInAction(() => {
        this.cropped = cropped
      })
    } catch (err) {
      logger.error('Failed to crop photo', {message: err})
    }
  }

  // Web manipulation
  async manipulate(
    attributes: {
      crop?: ActionCrop['crop']
    } & ImageManipulationAttributes,
  ) {
    let uploadWidth: number | undefined
    let uploadHeight: number | undefined

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
      const croppedHeight = crop.height * this.height
      const croppedWidth = crop.width * this.width
      modifiers.push({
        crop: {
          originX: crop.originX * this.width,
          originY: crop.originY * this.height,
          height: croppedHeight,
          width: croppedWidth,
        },
      })

      const uploadDimensions = this.getUploadDimensions(
        {width: croppedWidth, height: croppedHeight},
        POST_IMG_MAX,
        aspectRatio,
      )

      uploadWidth = uploadDimensions.width
      uploadHeight = uploadDimensions.height
    } else {
      const uploadDimensions = this.getUploadDimensions(
        {width: this.width, height: this.height},
        POST_IMG_MAX,
        aspectRatio,
      )

      uploadWidth = uploadDimensions.width
      uploadHeight = uploadDimensions.height
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

    const result = await ImageManipulator.manipulateAsync(
      this.path,
      [
        ...modifiers,
        {
          resize:
            ratioMultiplier > 1 ? {width: uploadWidth} : {height: uploadHeight},
        },
      ],
      {
        base64: true,
        format: SaveFormat.JPEG,
      },
    )

    runInAction(() => {
      this.cropped = {
        mime: 'image/jpeg',
        path: result.uri,
        size:
          result.base64 !== undefined
            ? getDataUriSize(result.base64)
            : MAX_IMAGE_SIZE_IN_BYTES + 999, // shouldn't hit this unless manipulation fails
        ...result,
      }
    })
  }

  resetCropped() {
    this.manipulate({})
  }

  previous() {
    this.cropped = this.prev
    this.attributes = this.prevAttributes
  }
}
