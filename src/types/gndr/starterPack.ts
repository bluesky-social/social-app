import {AppGndrGraphDefs} from '@gander-social-atproto/api'

export const isBasicView = AppGndrGraphDefs.isStarterPackViewBasic
export const isView = AppGndrGraphDefs.isStarterPackView

/**
 * Matches any starter pack view exported by our SDK
 */
export type AnyStarterPackView =
  | AppGndrGraphDefs.StarterPackViewBasic
  | AppGndrGraphDefs.StarterPackView
