import {Share} from 'react-native'

import * as Toast from '../view/com/util/Toast'

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export interface Image {
  path: string
  mime: string
  size: number
  width: number
  height: number
}

export async function downloadAndResize(_opts: DownloadAndResizeOpts) {
  // TODO
  throw new Error('TODO')
}

export interface ResizeOpts {
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
}

export async function resize(
  _localUri: string,
  _opts: ResizeOpts,
): Promise<Image> {
  // TODO
  throw new Error('TODO')
}

export async function compressIfNeeded(
  _img: Image,
  _maxSize: number,
): Promise<Image> {
  // TODO
  throw new Error('TODO')
}

export interface Dim {
  width: number
  height: number
}
export function scaleDownDimensions(dim: Dim, max: Dim): Dim {
  if (dim.width < max.width && dim.height < max.height) {
    return dim
  }
  let wScale = dim.width > max.width ? max.width / dim.width : 1
  let hScale = dim.height > max.height ? max.height / dim.height : 1
  if (wScale < hScale) {
    return {width: dim.width * wScale, height: dim.height * wScale}
  }
  return {width: dim.width * hScale, height: dim.height * hScale}
}

export const saveImageModal = async (_opts: {uri: string}) => {
  // TODO
  throw new Error('TODO')
}
