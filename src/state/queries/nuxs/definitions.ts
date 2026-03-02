import type zod from 'zod'

import {type BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  NeueTypography = 'NeueTypography',
  ExploreInterestsCard = 'ExploreInterestsCard',
  InitialVerificationAnnouncement = 'InitialVerificationAnnouncement',
  ActivitySubscriptions = 'ActivitySubscriptions',
  AgeAssuranceDismissibleNotice = 'AgeAssuranceDismissibleNotice',
  AgeAssuranceDismissibleFeedBanner = 'AgeAssuranceDismissibleFeedBanner',
  BookmarksAnnouncement = 'BookmarksAnnouncement',
  FindContactsAnnouncement = 'FindContactsAnnouncement',
  FindContactsDismissibleBanner = 'FindContactsDismissibleBanner',
  LiveNowBetaDialog = 'LiveNowBetaDialog',
  LiveNowBetaNudge = 'LiveNowBetaNudge',
  DraftsAnnouncement = 'DraftsAnnouncement',

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
  | {
      id: Nux.BookmarksAnnouncement
      data: undefined
    }
  | {
      id: Nux.FindContactsAnnouncement
      data: undefined
    }
  | {
      id: Nux.FindContactsDismissibleBanner
      data: undefined
    }
  | {
      id: Nux.LiveNowBetaDialog
      data: undefined
    }
  | {
      id: Nux.LiveNowBetaNudge
      data: undefined
    }
  | {
      id: Nux.DraftsAnnouncement
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
  [Nux.BookmarksAnnouncement]: undefined,
  [Nux.FindContactsAnnouncement]: undefined,
  [Nux.FindContactsDismissibleBanner]: undefined,
  [Nux.LiveNowBetaDialog]: undefined,
  [Nux.LiveNowBetaNudge]: undefined,
  [Nux.DraftsAnnouncement]: undefined,
}
