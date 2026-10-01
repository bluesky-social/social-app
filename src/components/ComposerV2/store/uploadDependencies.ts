import {uploadBlob} from '#/lib/api/upload-blob'
import {AbortError} from '#/lib/async/cancelable'
import {compressImage} from '#/lib/media/image/compress'
import {getImageDim} from '#/lib/media/manip'
import {getUriSize} from '#/lib/media/uriSize'
import {compressVideo} from '#/lib/media/video/compress'
import {uploadVideo} from '#/lib/media/video/upload'
import {createTokenlessVideoServiceClient} from '#/lib/media/video/util'
import {getVideoMetadata} from '#/view/com/composer/videos/metadata'
import {copyVideoToCache} from '#/components/ComposerV2/store/utils/copyVideoToCache'
import {
  type ImageUploadDependencies,
  type VideoUploadDependencies,
} from './uploads'

/*
 * Production implementations createThreadStore hands the upload workers.
 * Tests never swap these here; they fake a worker's dependencies by calling
 * it directly or through `__uploadWorkers`.
 */
export const imageUploadDependencies: ImageUploadDependencies = {
  getImageDimensions: getImageDim,
  compressImage,
  uploadBlob,
}

export const videoUploadDependencies: VideoUploadDependencies = {
  getVideoMetadata,
  getImageDimensions: getImageDim,
  getFileSize: getUriSize,
  copyVideoToCache,
  compressVideo,
  uploadVideo,
  uploadBlob,
  createVideoServiceClient: createTokenlessVideoServiceClient,
  sleep: abortableSleep,
}

function abortableSleep({ms, signal}: {ms: number; signal: AbortSignal}) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new AbortError())
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new AbortError())
      },
      {once: true},
    )
  })
}
