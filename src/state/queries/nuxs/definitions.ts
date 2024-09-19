import zod from 'zod'

import {BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  TenMillionDialog = 'TenMillionDialog',
  NeueTypography = 'NeueTypography',
}

export const nuxNames = new Set(Object.values(Nux))

export type AppNux =
  | BaseNux<{
      id: Nux.TenMillionDialog
      data: undefined
    }>
  | BaseNux<{
      id: Nux.NeueTypography
      data: undefined
    }>

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.TenMillionDialog]: undefined,
  [Nux.NeueTypography]: undefined,
}
