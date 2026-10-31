import {uploadBlob} from '#/lib/api/upload-blob'
import {AbortError} from '#/lib/async/cancelable'
import {compressImage} from '#/lib/media/image/compress'
import {getImageDim} from '#/lib/media/manip'
import {getUriSize} from '#/lib/media/uriSize'
import {compressVideo} from '#/lib/media/video/compress'
import {createVideoTelemetry} from '#/lib/media/video/telemetry'
import {uploadVideo} from '#/lib/media/video/upload'
import {createTokenlessVideoServiceClient} from '#/lib/media/video/util'
import {getVideoMetadata} from '#/view/com/composer/videos/metadata'
import {copyVideoToCache} from '#/components/ComposerV2/store/utils/copyVideoToCache'
import {createConcurrencyLimit} from '#/components/ComposerV2/store/utils/createConcurrencyLimit'
import {createScalarVideoMetadata} from '#/components/ComposerV2/store/utils/createScalarVideoMetadata'
import {
  releaseCompressedImage,
  releaseCompressedVideo,
  releaseVideoProbeUri,
} from '#/components/ComposerV2/store/utils/mediaRelease'
import {
  type ImageUploadDependencies,
  type VideoUploadDependencies,
} from './uploads'

/*
 * One module-level limiter, so the cap holds across posts, retries, and
 * overlapping stores, including a replaced store whose old compression is
 * still running. Max 1 is a conservative way to reduce peak memory without
 * device heuristics. Video compression does not use it.
 */
const limitImageCompression = createConcurrencyLimit({max: 1})

/*
 * Production implementations createThreadStore hands the upload workers.
 * Tests never swap these here; they fake a worker's dependencies by calling
 * it directly or through `__uploadWorkers`.
 */
export const imageUploadDependencies: ImageUploadDependencies = {
  getImageDimensions: getImageDim,
  compressImage,
  uploadBlob,
  releaseCompressedImage,
  limitImageCompression,
}

export const videoUploadDependencies: VideoUploadDependencies = {
  /* The shared helper's returned URI is a new object URL on web; see the adapter. */
  getVideoMetadata: createScalarVideoMetadata({
    getVideoMetadata,
    releaseProbeUri: releaseVideoProbeUri,
  }),
  getImageDimensions: getImageDim,
  getFileSize: getUriSize,
  copyVideoToCache,
  createVideoTelemetry,
  compressVideo,
  uploadVideo,
  releaseCompressedVideo,
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
