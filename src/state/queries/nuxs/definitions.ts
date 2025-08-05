import type zod from 'zod'

import {type BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  NeueTypography = 'NeueTypography',
  ExploreInterestsCard = 'ExploreInterestsCard',
  InitialVerificationAnnouncement = 'InitialVerificationAnnouncement',
  ActivitySubscriptions = 'ActivitySubscriptions',
  AgeAssuranceDismissibleNotice = 'AgeAssuranceDismissibleNotice',
  AgeAssuranceDismissibleFeedBanner = 'AgeAssuranceDismissibleFeedBanner',

  /*
   * Blocking announcements. New IDs are required for each new announcement.
   */
  PolicyUpdate202508 = 'PolicyUpdate202508',
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
  | {
      id: Nux.PolicyUpdate202508
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
  [Nux.PolicyUpdate202508]: undefined,
}
