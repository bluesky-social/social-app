import {type ComposerImage} from '#/state/gallery'
import {composerReducer, createComposerState} from './composer'

jest.mock('#/state/gallery', () => ({
  createInitialImages: jest.fn(),
}))
jest.mock('#/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}))
jest.mock('#/state/queries/postgate/util', () => ({
  createPostgateRecord: jest.fn(() => ({})),
}))
jest.mock('#/state/queries/threadgate', () => ({
  threadgateRecordToAllowUISetting: jest.fn(() => []),
}))

function createState() {
  return createComposerState({
    initText: undefined,
    initMention: undefined,
    initImageUris: undefined,
    initQuoteUri: undefined,
    initInteractionSettings: undefined,
  })
}

describe('composerReducer', () => {
  describe('add_post', () => {
    it('selects the appended post and requests focus', () => {
      const state = createState()

      const nextState = composerReducer(state, {type: 'add_post'})

      expect(nextState.thread.posts).toHaveLength(2)
      expect(nextState.activePostIndex).toBe(1)
      expect(nextState.mutableNeedsFocusActive).toBe(true)
    })

    it('selects a post inserted in the middle of a thread', () => {
      let state = createState()
      state = composerReducer(state, {type: 'add_post'})
      state = composerReducer(state, {type: 'add_post'})

      const lastPostId = state.thread.posts[2].id
      state = composerReducer(state, {
        type: 'focus_post',
        postId: state.thread.posts[0].id,
      })

      const nextState = composerReducer(state, {type: 'add_post'})

      expect(nextState.thread.posts).toHaveLength(4)
      expect(nextState.activePostIndex).toBe(1)
      expect(nextState.thread.posts[2].id).not.toBe(lastPostId)
      expect(nextState.thread.posts[3].id).toBe(lastPostId)
      expect(nextState.mutableNeedsFocusActive).toBe(true)
    })
  })

  describe('embed_add_generated_image_alt', () => {
    function createImage(id: string, alt = ''): ComposerImage {
      return {
        alt,
        source: {
          id,
          path: `file:///cache/${id}.jpg`,
          width: 100,
          height: 100,
          mime: 'image/jpeg',
        },
      }
    }

    function withImages(images: ComposerImage[]) {
      const state = createState()
      return composerReducer(state, {
        type: 'update_post',
        postId: state.thread.posts[0].id,
        postAction: {type: 'embed_add_images', images},
      })
    }

    function getImages(state: ReturnType<typeof createState>) {
      const media = state.thread.posts[0].embed.media
      if (media?.type !== 'images' && media?.type !== 'gallery') return []
      return media.images
    }

    function getAlts(state: ReturnType<typeof createState>) {
      return getImages(state).map(image => image.alt)
    }

    it('fills in alt text for the matching image', () => {
      const state = withImages([createImage('a'), createImage('b')])

      const nextState = composerReducer(state, {
        type: 'update_post',
        postId: state.thread.posts[0].id,
        postAction: {
          type: 'embed_add_generated_image_alt',
          id: 'b',
          alt: 'A dog',
        },
      })

      expect(getAlts(nextState)).toEqual(['', 'A dog'])
      expect(getImages(nextState)[1].generatedAlt).toBe('A dog')
    })

    it('keeps alt text the user already wrote', () => {
      const state = withImages([createImage('a', 'My cat')])

      const nextState = composerReducer(state, {
        type: 'update_post',
        postId: state.thread.posts[0].id,
        postAction: {
          type: 'embed_add_generated_image_alt',
          id: 'a',
          alt: 'A dog',
        },
      })

      expect(getAlts(nextState)).toEqual(['My cat'])
      expect(getImages(nextState)[0].generatedAlt).toBeUndefined()
    })

    it('replaces a suggestion the user has not edited', () => {
      const state = withImages([
        {...createImage('a', 'A dog'), generatedAlt: 'A dog'},
      ])

      const nextState = composerReducer(state, {
        type: 'update_post',
        postId: state.thread.posts[0].id,
        postAction: {
          type: 'embed_add_generated_image_alt',
          id: 'a',
          alt: 'Un chien',
        },
      })

      expect(getAlts(nextState)).toEqual(['Un chien'])
      expect(getImages(nextState)[0].generatedAlt).toBe('Un chien')
    })

    it('keeps a suggestion the user has edited', () => {
      const state = withImages([
        {...createImage('a', 'A good dog'), generatedAlt: 'A dog'},
      ])

      const nextState = composerReducer(state, {
        type: 'update_post',
        postId: state.thread.posts[0].id,
        postAction: {
          type: 'embed_add_generated_image_alt',
          id: 'a',
          alt: 'Un chien',
        },
      })

      expect(getAlts(nextState)).toEqual(['A good dog'])
    })

    it('does not mark the composer as dirty', () => {
      const state = {...withImages([createImage('a')]), isDirty: false}

      const nextState = composerReducer(state, {
        type: 'update_post',
        postId: state.thread.posts[0].id,
        postAction: {
          type: 'embed_add_generated_image_alt',
          id: 'a',
          alt: 'A dog',
        },
      })

      expect(nextState.isDirty).toBe(false)
    })
  })
})
