import {type ComponentType} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'
import {type AppBskyEmbedExternal} from '@atproto/api'

export type CustomEmbedComponentProps = {
  view: AppBskyEmbedExternal.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * A client-side custom embed handler. Each handler decides whether it can
 * render a given external embed (via `match`) and, if so, provides a component
 * to render it. Handlers are matched in registry order; the first match wins.
 *
 * This is intentionally a fork-owned abstraction that sits *beside* upstream's
 * external embed rendering. See `registry.ts` and the README for how it plugs
 * into `#/components/Post/Embed`.
 */
export type CustomEmbedHandler = {
  id: string
  match: (view: AppBskyEmbedExternal.ViewExternal) => boolean
  Component: ComponentType<CustomEmbedComponentProps>
}
