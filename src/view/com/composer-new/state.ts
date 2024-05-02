import {RichText} from '@atproto/api'
import {TID} from '@atproto/common-web'

import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {ComposerOpts, ComposerOptsPostRef} from '#/state/shell/composer'

export interface ComposedPostState {
  key: string
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
  | {type: 'setActive'; index: number}
  | {type: 'setText'; index: number; richText: RichText}
  | {type: 'addPost'; index: number}
  | {type: 'removePost'; index: number}

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
      if (state.active === action.index) {
        return state
      }

      return computeComposer({
        ...state,
        active: action.index,
      })
    }
    case 'setText': {
      return computeComposer({
        ...state,
        posts: state.posts.map((p, i) => {
          if (i === action.index) {
            return computePost({...p, richText: action.richText})
          }

          return p
        }),
      })
    }
    case 'addPost': {
      const posts = state.posts
      const target = posts[action.index]

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
      const nextIndex = newPosts[action.index + 1]
        ? action.index
        : newPosts[action.index - 1]
        ? action.index - 1
        : null

      if (nextIndex === null) {
        return state
      }

      newPosts.splice(action.index, 1)

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

  return computePost({key: TID.nextStr(), richText})
}

const computeComposer = (state: ComposedState): Composed => {
  return {...state, canPost: state.posts.every(p => p.length > 0)}
}

const computePost = (post: ComposedPostState): ComposedPost => {
  return {...post, length: shortenLinks(post.richText).graphemeLength}
}
