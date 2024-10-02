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

type ComposerEmbed = {
  // TODO: Other record types.
  record: PostRecord | undefined
  // TODO: Other media types.
  media: ImagesMedia | undefined
}

export type ComposerState = {
  // TODO: Other draft data.
  embed: ComposerEmbed
  video: VideoState // TODO: Move into embed.
}

export type ComposerAction =
  | {type: 'embed_add_images'; images: ComposerImage[]}
  | {type: 'embed_update_image'; image: ComposerImage}
  | {type: 'embed_remove_image'; image: ComposerImage}
  | {type: 'video_action'; videoAction: VideoAction}

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
    case 'video_action': {
      const videoAction = action.videoAction
      return {
        ...state,
        video: videoReducer(state.video, videoAction),
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
  return {
    video: createVideoState(), // TODO: Move into embed.
    embed: {
      record: undefined,
      media,
    },
  }
}
