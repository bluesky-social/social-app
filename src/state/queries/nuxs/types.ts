import {AppBskyActorDefs} from '@atproto/api'

type Data = Record<string, unknown> | undefined

export type BaseNux<
  T extends Pick<AppBskyActorDefs.Nux, 'id' | 'expiresAt'> & {data: Data},
> = Pick<AppBskyActorDefs.Nux, 'id' | 'completed' | 'expiresAt'> & T
