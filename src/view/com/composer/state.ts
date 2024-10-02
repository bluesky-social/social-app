import {ImagePickerAsset} from 'expo-image-picker'

import {ComposerImage, createInitialImages} from '#/state/gallery'
import {
  createVideoState,
  VideoAction,
  videoReducer,
  VideoState,
} from '#/state/queries/video/video'
import {ComposerOpts} from '#/state/shell/composer'

type PostRecord = {
  uri: string
}

type ImagesMedia = {
  type: 'images'
  images: ComposerImage[]
  labels: string[]
}

type VideoMedia = {
  type: 'video'
  video: VideoState
}

type ComposerEmbed = {
  // TODO: Other record types.
  record: PostRecord | undefined
  // TODO: Other media types.
  media: ImagesMedia | VideoMedia | undefined
}

export type ComposerState = {
  // TODO: Other draft data.
  embed: ComposerEmbed
}

export type ComposerAction =
  | {type: 'embed_add_images'; images: ComposerImage[]}
  | {type: 'embed_update_image'; image: ComposerImage}
  | {type: 'embed_remove_image'; image: ComposerImage}
  | {
      type: 'embed_add_video'
      asset: ImagePickerAsset
      abortController: AbortController
    }
  | {type: 'embed_remove_video'}
  | {type: 'embed_update_video'; videoAction: VideoAction}

const MAX_IMAGES = 4

export function composerReducer(
  state: ComposerState,
  action: ComposerAction,
): ComposerState {
  switch (action.type) {
    case 'embed_add_images': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'images',
          images: action.images.slice(0, MAX_IMAGES),
          labels: [],
        }
      } else if (prevMedia.type === 'images') {
        nextMedia = {
          ...prevMedia,
          images: [...prevMedia.images, ...action.images].slice(0, MAX_IMAGES),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_image': {
      const prevMedia = state.embed.media
      if (prevMedia?.type === 'images') {
        const updatedImage = action.image
        const nextMedia = {
          ...prevMedia,
          images: prevMedia.images.map(img => {
            if (img.source.id === updatedImage.source.id) {
              return updatedImage
            }
            return img
          }),
        }
        return {
          ...state,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_remove_image': {
      const prevMedia = state.embed.media
      if (prevMedia?.type === 'images') {
        const removedImage = action.image
        let nextMedia: ImagesMedia | undefined = {
          ...prevMedia,
          images: prevMedia.images.filter(img => {
            return img.source.id !== removedImage.source.id
          }),
        }
        if (nextMedia.images.length === 0) {
          nextMedia = undefined
        }
        return {
          ...state,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_add_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'video',
          video: createVideoState(action.asset, action.abortController),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_video': {
      const videoAction = action.videoAction
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        nextMedia = {
          ...prevMedia,
          video: videoReducer(prevMedia.video, videoAction),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_remove_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        nextMedia = undefined
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    default:
      return state
  }
}

export function createComposerState({
  initImageUris,
}: {
  initImageUris: ComposerOpts['imageUris']
}): ComposerState {
  let media: ImagesMedia | undefined
  if (initImageUris?.length) {
    media = {
      type: 'images',
      images: createInitialImages(initImageUris),
      labels: [],
    }
  }
  // TODO: initial video.
  return {
    embed: {
      record: undefined,
      media,
    },
  }
}
