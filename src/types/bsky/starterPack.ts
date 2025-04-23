import {AppBskyGraphDefs} from '@atproto/api'

export const isBasicView = AppBskyGraphDefs.isStarterPackViewBasic
export const isView = AppBskyGraphDefs.isStarterPackView

/**
 * Matches any starter pack view exported by our SDK
 */
export type AnyStarterPackView =
  | AppBskyGraphDefs.StarterPackViewBasic
  | AppBskyGraphDefs.StarterPackView
