import {type app} from '#/lexicons'

export type Data = Record<string, unknown> | undefined

export type BaseNux<
  T extends Pick<app.bsky.actor.defs.Nux, 'id' | 'expiresAt'> & {data: Data},
> = Pick<app.bsky.actor.defs.Nux, 'id' | 'completed' | 'expiresAt'> & T
