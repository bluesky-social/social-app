/**
 * The ComposerV2 store: a small subscribable container around ComposerState.
 *
 * Provider-owned (one instance per composer session) so tests can construct a
 * fresh store without any React tree. Pure reducers from ./reducers do all the
 * state transitions; the store factory wraps them with id generation, listener
 * notification, and side-effects like kicking off background uploads.
 *
 * The `agent` is held in a private closure for the upload worker. State held
 * by the store is plain data so that snapshot/restore (for OS-resume) and
 * thin-adapter export to the saved-draft format are trivial.
 */
import {type AtpAgent} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import * as reducers from './reducers'
import {startImageUpload, startVideoUpload} from './uploads'
import {
  type ComposerState,
  type ExternalEmbed,
  type GifItem,
  type NewImageInput,
  type NewVideoInput,
  type Quote,
  type ReplyTo,
  type UploadStatus,
} from './types'

type Listener = () => void

export type ComposerActions = {
  updateText(postId: string, text: string): void
  updateLangs(postId: string, langs: string[]): void
  updateLabels(postId: string, labels: string[]): void

  appendPost(): string
  insertPostAfter(afterId: string): string
  removePost(postId: string): void
  setActivePost(postId: string): void

  addImages(postId: string, images: NewImageInput[]): string[]
  removeImage(postId: string, imageId: string): void
  updateImageAltText(postId: string, imageId: string, altText: string): void

  setVideo(postId: string, video: NewVideoInput): string
  removeVideo(postId: string): void
  updateVideoAltText(postId: string, altText: string): void

  setGif(postId: string, gif: Omit<GifItem, 'id'>): string
  removeGif(postId: string): void
  updateGifAltText(postId: string, altText: string): void

  setExternal(postId: string, external: ExternalEmbed): void
  removeExternal(postId: string): void

  setQuote(postId: string, quote: Quote): void
  removeQuote(postId: string): void

  /** Called by the upload worker when an image or video upload progresses. */
  setUploadStatus(mediaId: string, status: UploadStatus): void
}

export type ComposerStore = {
  getState(): ComposerState
  subscribe(listener: Listener): () => void
  actions: ComposerActions
  destroy(): void
}

export type CreateComposerStoreOptions = {
  agent: AtpAgent
  replyTo?: ReplyTo
  draftId?: string
  /** Override id generation; useful for deterministic tests. */
  idGenerator?: () => string
}

export function createComposerStore(
  options: CreateComposerStoreOptions,
): ComposerStore {
  const newId = options.idGenerator ?? nanoid
  // The agent is captured by the upload worker via getAgent(); held here so
  // future actions (publish, draft save) can reach it without re-passing.
  const agent = options.agent

  let state: ComposerState = reducers.createInitialState({
    rootPostId: newId(),
    replyTo: options.replyTo,
    draftId: options.draftId,
  })
  const listeners = new Set<Listener>()
  let destroyed = false

  function getState() {
    return state
  }

  function subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function set(next: ComposerState) {
    if (next === state) return
    state = next
    for (const listener of listeners) listener()
  }

  function apply<A>(
    reducer: (s: ComposerState, args: A) => ComposerState,
    args: A,
  ) {
    if (destroyed) return
    set(reducer(state, args))
  }

  const actions: ComposerActions = {
    updateText(postId, text) {
      apply(reducers.updateText, {postId, text})
    },
    updateLangs(postId, langs) {
      apply(reducers.updateLangs, {postId, langs})
    },
    updateLabels(postId, labels) {
      apply(reducers.updateLabels, {postId, labels})
    },

    appendPost() {
      const id = newId()
      apply(reducers.appendPost, {id})
      return id
    },
    insertPostAfter(afterId) {
      const id = newId()
      apply(reducers.insertPostAfter, {afterId, id})
      return id
    },
    removePost(postId) {
      apply(reducers.removePost, {postId})
    },
    setActivePost(postId) {
      apply(reducers.setActivePost, {postId})
    },

    addImages(postId, images) {
      const withIds = images.map(img => ({
        ...img,
        id: newId(),
        localRefPath: `image:${newId()}`,
      }))
      apply(reducers.addImages, {postId, images: withIds})
      for (const img of withIds) {
        startImageUpload({
          mediaId: img.id,
          uri: img.uri,
          agent,
          setUploadStatus: actions.setUploadStatus,
          isAlive: () => !destroyed,
        })
      }
      return withIds.map(i => i.id)
    },
    removeImage(postId, imageId) {
      apply(reducers.removeImage, {postId, imageId})
    },
    updateImageAltText(postId, imageId, altText) {
      apply(reducers.updateImageAltText, {postId, imageId, altText})
    },

    setVideo(postId, video) {
      const id = newId()
      const localRefPath = `video:${video.mimeType}:${newId()}`
      apply(reducers.setVideo, {
        postId,
        video: {
          id,
          uri: video.uri,
          width: video.width,
          height: video.height,
          mimeType: video.mimeType,
          altText: video.altText ?? '',
          localRefPath,
          captions: [],
          upload: {state: 'pending'},
        },
      })
      startVideoUpload({
        mediaId: id,
        uri: video.uri,
        agent,
        setUploadStatus: actions.setUploadStatus,
        isAlive: () => !destroyed,
      })
      return id
    },
    removeVideo(postId) {
      apply(reducers.removeVideo, {postId})
    },
    updateVideoAltText(postId, altText) {
      apply(reducers.updateVideoAltText, {postId, altText})
    },

    setGif(postId, gif) {
      const id = newId()
      apply(reducers.setGif, {postId, gif: {id, ...gif}})
      return id
    },
    removeGif(postId) {
      apply(reducers.removeGif, {postId})
    },
    updateGifAltText(postId, altText) {
      apply(reducers.updateGifAltText, {postId, altText})
    },

    setExternal(postId, external) {
      apply(reducers.setExternal, {postId, external})
    },
    removeExternal(postId) {
      apply(reducers.removeExternal, {postId})
    },

    setQuote(postId, quote) {
      apply(reducers.setQuote, {postId, quote})
    },
    removeQuote(postId) {
      apply(reducers.removeQuote, {postId})
    },

    setUploadStatus(mediaId, status) {
      apply(reducers.setUploadStatus, {mediaId, status})
    },
  }

  function destroy() {
    destroyed = true
    listeners.clear()
  }

  return {getState, subscribe, actions, destroy}
}
