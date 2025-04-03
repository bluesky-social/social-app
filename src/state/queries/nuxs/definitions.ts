import zod from 'zod'

import {BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  Example = 'Example', // no actually used, here for reference
}
export const nuxNames = new Set(Object.values(Nux))

/**
 * Nuxes that have been retired and should be cleared from storage.
 */
export enum RetiredNux {
  NeueTypography = 'NeueTypography',
}
export const retiredNuxNames = Object.values(RetiredNux)

export type AppNux = BaseNux<{
  id: Nux.Example
  data: undefined
}>

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.Example]: undefined,
}
