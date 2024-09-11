import zod from 'zod'

import {BaseNux} from '#/state/queries/nux/types'

export enum Nux {
  One = 'one',
  Two = 'two',
}

export const nuxNames = new Set(Object.values(Nux))

export type AppNux =
  | BaseNux<{
      id: Nux.One
      data: {
        likes: number
      }
    }>
  | BaseNux<{
      id: Nux.Two
      data: undefined
    }>

export const NuxSchemas = {
  [Nux.One]: zod.object({
    likes: zod.number(),
  }),
  [Nux.Two]: undefined,
}
