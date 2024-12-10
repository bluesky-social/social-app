import zod from 'zod'

import {BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  BlueskyPlus_Core_RightNav = 'BlueskyPlus_Core_RightNav',
}

export const nuxNames = new Set(Object.values(Nux))

export type AppNux = BaseNux<{
  id: Nux.BlueskyPlus_Core_RightNav
  data: undefined
}>

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.BlueskyPlus_Core_RightNav]: undefined,
}
