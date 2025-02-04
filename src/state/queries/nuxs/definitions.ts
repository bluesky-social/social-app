import type zod from 'zod'

import {type BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  NeueTypography = 'NeueTypography',
  ExploreInterestsCard = 'ExploreInterestsCard',
  InitialVerificationAnnouncement = 'InitialVerificationAnnouncement',
}
export const nuxNames = new Set(Object.values(Nux))

export type AppNux = BaseNux<
  | {
      id: Nux.NeueTypography
      data: undefined
    }
  | {
      id: Nux.ExploreInterestsCard
      data: undefined
    }
  | {
      id: Nux.InitialVerificationAnnouncement
      data: undefined
    }
>

/**
 * Nuxes that have been retired and should be cleared from storage.
 */
export enum RetiredNux {
  NeueTypography = 'NeueTypography',
}
export const retiredNuxNames = Object.values(RetiredNux)

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.NeueTypography]: undefined,
  [Nux.ExploreInterestsCard]: undefined,
  [Nux.InitialVerificationAnnouncement]: undefined,
}
