import {AppBskyActorDefs} from '@atproto/api'

export type Data = Record<string, unknown> | undefined

export type BaseNux<
  T extends Pick<AppBskyActorDefs.Nux, 'id' | 'expiresAt'> & {data: Data},
> = T & {
  completed: boolean
}
