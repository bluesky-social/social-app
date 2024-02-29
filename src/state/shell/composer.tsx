import React from 'react'
import {
  AppBskyEmbedRecord,
  AppBskyRichtextFacet,
  PostModeration,
} from '@atproto/api'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

export interface ComposerOptsPostRef {
  uri: string
  cid: string
  text: string
  author: {
    handle: string
    displayName?: string
    avatar?: string
  }
  embed?: AppBskyEmbedRecord.ViewRecord['embed']
  moderation?: PostModeration
}
export interface ComposerOptsQuote {
  uri: string
  cid: string
  text: string
  facets?: AppBskyRichtextFacet.Main[]
  indexedAt: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  embeds?: AppBskyEmbedRecord.ViewRecord['embeds']
}
export interface ComposerOpts {
  replyTo?: ComposerOptsPostRef
  onPost?: () => void
  quote?: ComposerOptsQuote
  mention?: string // handle of user to mention
  openPicker?: (pos: DOMRect | undefined) => void
  text?: string
  imageUris?: {uri: string; width: number; height: number}[]
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
  const [state, setState] = React.useState<StateContext>()

  const openComposer = useNonReactiveCallback((opts: ComposerOpts) => {
    setState(opts)
  })

  const closeComposer = useNonReactiveCallback(() => {
    let wasOpen = !!state
    setState(undefined)
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
  return React.useContext(controlsContext)
}
