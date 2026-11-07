import {type ImagePickerAsset} from 'expo-image-picker'

import {type GetVideoMetadata} from '#/components/ComposerV2/store/prepareMediaSource'

/**
 * Adapts the shared video metadata helper to the scalar-only dependency the
 * worker consumes. `releaseProbeUri` frees the URI the helper returned once
 * the scalars are extracted. Pass it only when that URI is known to be a new
 * resource the helper created (web); on native the returned URI is the source
 * itself, which the caller owns. If the helper rejects, it never returned a
 * URI to release.
 */
export function createScalarVideoMetadata({
  getVideoMetadata,
  releaseProbeUri,
}: {
  getVideoMetadata: (
    file: File | string,
    fallbackMimeType?: string,
  ) => Promise<ImagePickerAsset>
  releaseProbeUri: (args: {uri: string}) => void
}): GetVideoMetadata {
  return async (file, fallbackMimeType) => {
    const probed = await getVideoMetadata(file, fallbackMimeType)
    try {
      return {
        width: probed.width,
        height: probed.height,
        mimeType: probed.mimeType,
        duration: probed.duration,
        fileSize: probed.fileSize,
      }
    } finally {
      try {
        releaseProbeUri({uri: probed.uri})
      } catch {
        /* A leaked probe URL must not change the metadata outcome. */
      }
    }
  }
}
