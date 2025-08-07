import {type AppGndrActorDefs} from '@gander-social-atproto/api'

export type Data = Record<string, unknown> | undefined

export type BaseNux<
  T extends Pick<AppGndrActorDefs.Nux, 'id' | 'expiresAt'> & {data: Data},
> = Pick<AppGndrActorDefs.Nux, 'id' | 'completed' | 'expiresAt'> & T
