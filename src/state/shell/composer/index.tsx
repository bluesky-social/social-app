import React from 'react'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type ModerationDecision,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {postUriToRelativePath, toBskyAppUrl} from '#/lib/strings/url-helpers'
import {purgeTemporaryImageFiles} from '#/state/gallery'
import {precacheResolveLinkQuery} from '#/state/queries/resolve-link'
import {type EmojiPickerPosition} from '#/view/com/composer/text-input/web/EmojiPicker'
import * as Toast from '#/view/com/util/Toast'

export interface ComposerOptsPostRef {
  uri: string
  cid: string
  text: string
  author: AppBskyActorDefs.ProfileViewBasic
  embed?: AppBskyFeedDefs.PostView['embed']
  moderation?: ModerationDecision
}

export interface ComposerOpts {
  replyTo?: ComposerOptsPostRef
  onPost?: (postUri: string | undefined) => void
  quote?: AppBskyFeedDefs.PostView
  mention?: string // handle of user to mention
  openEmojiPicker?: (pos: EmojiPickerPosition | undefined) => void
  text?: string
  imageUris?: {uri: string; width: number; height: number; altText?: string}[]
  videoUri?: {uri: string; width: number; height: number}
}

type StateContext = ComposerOpts | undefined
type ControlsContext = {
  openComposer: (opts: ComposerOpts) => void
  closeComposer: () => boolean
}

const stateContext = React.createContext<StateContext>(undefined)
const controlsContext = React.createContext<ControlsContext>({
  openComposer(_opts: ComposerOpts) {},
  closeComposer() {
    return false
  },
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {_} = useLingui()
  const [state, setState] = React.useState<StateContext>()
  const queryClient = useQueryClient()

  const openComposer = useNonReactiveCallback((opts: ComposerOpts) => {
    if (opts.quote) {
      const path = postUriToRelativePath(opts.quote.uri)
      if (path) {
        const appUrl = toBskyAppUrl(path)
        precacheResolveLinkQuery(queryClient, appUrl, {
          type: 'record',
          kind: 'post',
          record: {
            cid: opts.quote.cid,
            uri: opts.quote.uri,
          },
          view: opts.quote,
        })
      }
    }
    const author = opts.replyTo?.author || opts.quote?.author
    const isBlocked = Boolean(
      author &&
        (author.viewer?.blocking ||
          author.viewer?.blockedBy ||
          author.viewer?.blockingByList),
    )
    if (isBlocked) {
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
    } else {
      setState(prevOpts => {
        if (prevOpts) {
          // Never replace an already open composer.
          return prevOpts
        }
        return opts
      })
    }
  })

  const closeComposer = useNonReactiveCallback(() => {
    let wasOpen = !!state
    if (wasOpen) {
      setState(undefined)
      purgeTemporaryImageFiles()
    }

    return wasOpen
  })

  const api = React.useMemo(
    () => ({
      openComposer,
      closeComposer,
    }),
    [openComposer, closeComposer],
  )

  return (
    <stateContext.Provider value={state}>
      <controlsContext.Provider value={api}>
        {children}
      </controlsContext.Provider>
    </stateContext.Provider>
  )
}

export function useComposerState() {
  return React.useContext(stateContext)
}

export function useComposerControls() {
  const {closeComposer} = React.useContext(controlsContext)
  return React.useMemo(() => ({closeComposer}), [closeComposer])
}

/**
 * DO NOT USE DIRECTLY. The deprecation notice as a warning only, it's not
 * actually deprecated.
 *
 * @deprecated use `#/lib/hooks/useOpenComposer` instead
 */
export function useOpenComposer() {
  const {openComposer} = React.useContext(controlsContext)
  return React.useMemo(() => ({openComposer}), [openComposer])
}
