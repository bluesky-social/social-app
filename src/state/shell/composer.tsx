import React from 'react'
import {
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyRichtextFacet,
  ModerationDecision,
} from '@atproto/api'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

export interface ComposerOptsPostRef {
  uri: string
  cid: string
  text: string
  author: AppBskyActorDefs.ProfileViewBasic
  embed?: AppBskyEmbedRecord.ViewRecord['embed']
  moderation?: ModerationDecision
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
  onPost?: (postUri: string | undefined) => void
  quote?: ComposerOptsQuote
  quoteCount?: number
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
const openContext = React.createContext<boolean>(false)
const controlsContext = React.createContext<ControlsContext>({
  openComposer(_opts: ComposerOpts) {},
  closeComposer() {
    return false
  },
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<StateContext>()
  const [isOpen, setIsOpen] = React.useState(false)

  const openComposer = useNonReactiveCallback((opts: ComposerOpts) => {
    setState(opts)
    setIsOpen(true)
  })

  const closeComposer = useNonReactiveCallback(() => {
    let wasOpen = !!state
    setState(undefined)
    setIsOpen(false)
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
      <openContext.Provider value={isOpen}>
        <controlsContext.Provider value={api}>
          {children}
        </controlsContext.Provider>
      </openContext.Provider>
    </stateContext.Provider>
  )
}

export function useComposerState() {
  return React.useContext(stateContext)
}

export function useComposerControls() {
  return React.useContext(controlsContext)
}

export function useIsComposerOpen() {
  return React.useContext(openContext)
}
