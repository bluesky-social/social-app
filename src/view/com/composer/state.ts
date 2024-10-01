import {ComposerImage} from '#/state/gallery'

type PostRecord = {
  uri: string
}

type ImagesMedia = {
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
}

// TODO: Actual actions.
export type ComposerAction = {type: 'todo'}

export function composerReducer(
  state: ComposerState,
  _action: ComposerAction,
): ComposerState {
  return state
}

export function createComposerState(): ComposerState {
  // TODO: Initial data like images from intent.
  return {
    embed: {
      record: undefined,
      media: undefined,
    },
  }
}
