import {createContext, useContext, useMemo, useState} from 'react'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  type ModerationDecision,
} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {postUriToRelativePath, toBskyAppUrl} from '#/lib/strings/url-helpers'
import {purgeTemporaryImageFiles} from '#/state/gallery'
import {
  precacheResolveLinkQuery,
  RQKEY_GIF_ROOT,
  RQKEY_LINK_ROOT,
} from '#/state/queries/resolve-link'
import * as Toast from '#/components/Toast'

export interface ComposerOptsPostRef {
  uri: string
  cid: string
  text: string
  langs?: string[]
  author: AppBskyActorDefs.ProfileViewBasic
  embed?: AppBskyFeedDefs.PostView['embed']
  moderation?: ModerationDecision
}

export type OnPostSuccessData =
  | {
      replyToUri?: string
      posts: AppBskyUnspeccedGetPostThreadV2.ThreadItem[]
    }
  | undefined

export type ComposerLogContext =
  | 'Fab'
  | 'PostReply'
  | 'QuotePost'
  | 'ProfileFeed'
  | 'Deeplink'
  | 'Other'

export interface ComposerOpts {
  replyTo?: ComposerOptsPostRef
  onPost?: (postUri: string | undefined) => void
  onPostSuccess?: (data: OnPostSuccessData) => void
  quote?: AppBskyFeedDefs.PostView
  mention?: string // handle of user to mention
  text?: string
  imageUris?: {uri: string; width: number; height: number; altText?: string}[]
  videoUri?: {uri: string; width: number; height: number}
  openGallery?: boolean
  logContext?: ComposerLogContext
}

type StateContext = ComposerOpts | undefined
type ControlsContext = {
  openComposer: (opts: ComposerOpts) => void
  closeComposer: () => boolean
}

const stateContext = createContext<StateContext>(undefined)
stateContext.displayName = 'ComposerStateContext'
const controlsContext = createContext<ControlsContext>({
  openComposer(_opts: ComposerOpts) {},
  closeComposer() {
    return false
  },
})
controlsContext.displayName = 'ComposerControlsContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {_} = useLingui()
  const [state, setState] = useState<StateContext>()
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
      Toast.show(_(msg`Cannot interact with a blocked user`), {
        type: 'warning',
      })
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
      // Purging deletes cached thumbnails on disk, so remove the query
      // caches that may hold references to those now-deleted file paths.
      // Without this, restoring a draft would serve stale ResolvedLink
      // data pointing at missing files, causing "Failed to load blob".
      queryClient.removeQueries({queryKey: [RQKEY_LINK_ROOT]})
      queryClient.removeQueries({queryKey: [RQKEY_GIF_ROOT]})
    }

    return wasOpen
  })

  const api = useMemo(
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
  return useContext(stateContext)
}

export function useComposerControls() {
  const {closeComposer} = useContext(controlsContext)
  return useMemo(() => ({closeComposer}), [closeComposer])
}

/**
 * DO NOT USE DIRECTLY. The deprecation notice as a warning only, it's not
 * actually deprecated.
 *
 * @deprecated use `#/lib/hooks/useOpenComposer` instead
 */
export function useOpenComposer() {
  const {openComposer} = useContext(controlsContext)
  return useMemo(() => ({openComposer}), [openComposer])
}
