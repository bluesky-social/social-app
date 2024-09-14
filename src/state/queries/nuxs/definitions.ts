import zod from 'zod'

import {BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  TenMillionDialog = 'TenMillionDialog',
}

export const nuxNames = new Set(Object.values(Nux))

export type AppNux = BaseNux<{
  id: Nux.TenMillionDialog
  data: undefined
}>

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.TenMillionDialog]: undefined,
}
