import {RichText} from '@atproto/api'
import {TID} from '@atproto/common-web'

import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {ComposerOpts, ComposerOptsPostRef} from '#/state/shell/composer'

export interface ComposedPostState {
  id: string
  richText: RichText
}

export interface ComposedPost extends ComposedPostState {
  length: number
}

export interface ComposedState {
  replyTo: ComposerOptsPostRef | undefined
  active: number
  posts: ComposedPost[]
}

export interface Composed extends ComposedState {
  canPost: boolean
}

export type ComposedAction =
  | {type: 'setActive'; id: string}
  | {type: 'setText'; id: string; richText: RichText}
  | {type: 'addPost'; id: string}
  | {type: 'removePost'; id: string}

export const createComposerState = (data: ComposerOpts): Composed => {
  const initialText = data.text
    ? data.text
    : data.mention
    ? `@${data.mention}`
    : ''

  return computeComposer({
    replyTo: data.replyTo,
    active: 0,
    posts: [createPost(initialText)],
  })
}

export const reducer = (state: Composed, action: ComposedAction): Composed => {
  switch (action.type) {
    case 'setActive': {
      const index = state.posts.findIndex(p => p.id === action.id)

      if (index === -1 || state.active === index) {
        return state
      }

      return computeComposer({
        ...state,
        active: index,
      })
    }
    case 'setText': {
      return computeComposer({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.id) {
            return computePost({...p, richText: action.richText})
          }

          return p
        }),
      })
    }
    case 'addPost': {
      const posts = state.posts

      const initialIndex = posts.findIndex(p => p.id === action.id)

      if (initialIndex === -1) {
        return state
      }

      const target = posts[initialIndex]

      if (target.length === 0) {
        return state
      }

      const newPosts = posts.filter(p => p.length !== 0)
      const targetIndex = newPosts.indexOf(target)

      newPosts.splice(targetIndex + 1, 0, createPost())

      return computeComposer({
        ...state,
        active: targetIndex + 1,
        posts: newPosts,
      })
    }
    case 'removePost': {
      const newPosts = state.posts.slice()
      const index = newPosts.findIndex(p => p.id === action.id)

      if (index === -1) {
        return state
      }

      const nextIndex = newPosts[index + 1]
        ? index
        : newPosts[index - 1]
        ? index - 1
        : null

      if (nextIndex === null) {
        return state
      }

      newPosts.splice(index, 1)

      return computeComposer({
        ...state,
        active: nextIndex,
        posts: newPosts,
      })
    }
  }

  return state
}

const createPost = (text = ''): ComposedPost => {
  const richText = new RichText({text})
  if (text.length !== 0) {
    richText.detectFacetsWithoutResolution()
  }

  return computePost({id: TID.nextStr(), richText})
}

const computeComposer = (state: ComposedState): Composed => {
  return {...state, canPost: state.posts.every(p => p.length > 0)}
}

const computePost = (post: ComposedPostState): ComposedPost => {
  return {...post, length: shortenLinks(post.richText).graphemeLength}
}
