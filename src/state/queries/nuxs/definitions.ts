import type zod from 'zod'

import {type BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  NeueTypography = 'NeueTypography',
  NeueChar = 'NeueChar',
}

export const nuxNames = new Set(Object.values(Nux))

export type AppNux = BaseNux<
  | {
      id: Nux.NeueTypography
      data: undefined
    }
  | {
      id: Nux.NeueChar
      data: undefined
    }
>

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.NeueTypography]: undefined,
  [Nux.NeueChar]: undefined,
}
