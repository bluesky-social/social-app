import {
  type AppBskyEmbedExternal,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'

/**
 * Local extension of `app.bsky.embed.external#viewExternal` that mirrors
 * atproto PR #4915. Once @atproto/api ships those fields, delete this file
 * and replace usages with `AppBskyEmbedExternal.ViewExternal` directly.
 */
export type PublicationViewExternal = AppBskyEmbedExternal.ViewExternal & {
  createdAt?: string
  updatedAt?: string
  readingTime?: number
  source?: PublicationViewExternalSource
  associatedRecord?: ComAtprotoRepoStrongRef.Main
  associatedBskyPost?: ComAtprotoRepoStrongRef.Main
}

export interface PublicationViewExternalSource {
  $type?: 'app.bsky.embed.external#viewExternalSource'
  uri?: string
  icon?: string
  name?: string
  description?: string
  theme?: PublicationViewExternalSourceTheme
  associatedRecord?: ComAtprotoRepoStrongRef.Main
}

export interface PublicationViewExternalSourceTheme {
  $type?: 'app.bsky.embed.external#viewExternalSourceTheme'
  background?: PublicationColorRGB
  foreground?: PublicationColorRGB
  accent?: PublicationColorRGB
  accentForeground?: PublicationColorRGB
}

export interface PublicationColorRGB {
  r: number
  g: number
  b: number
}
