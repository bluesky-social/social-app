import type zod from 'zod'

import {type BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  NeueTypography = 'NeueTypography',
  ExploreInterestsCard = 'ExploreInterestsCard',
  InitialVerificationAnnouncement = 'InitialVerificationAnnouncement',
  ActivitySubscriptions = 'ActivitySubscriptions',
  AgeAssuranceDismissibleNotice = 'AgeAssuranceDismissibleNotice',
  AgeAssuranceDismissibleFeedBanner = 'AgeAssuranceDismissibleFeedBanner',
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
  | {
      id: Nux.ActivitySubscriptions
      data: undefined
    }
  | {
      id: Nux.AgeAssuranceDismissibleNotice
      data: undefined
    }
  | {
      id: Nux.AgeAssuranceDismissibleFeedBanner
      data: undefined
    }
>

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.NeueTypography]: undefined,
  [Nux.ExploreInterestsCard]: undefined,
  [Nux.InitialVerificationAnnouncement]: undefined,
  [Nux.ActivitySubscriptions]: undefined,
  [Nux.AgeAssuranceDismissibleNotice]: undefined,
  [Nux.AgeAssuranceDismissibleFeedBanner]: undefined,
}
