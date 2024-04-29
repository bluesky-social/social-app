import {Headers, XRPCError} from '@atproto/xrpc'

import * as TempDmDefs from './defs'

export interface QueryParams {
  cursor?: string
}

export type InputSchema = undefined

export interface OutputSchema {
  cursor?: string
  logs: (
    | TempDmDefs.LogBeginChat
    | TempDmDefs.LogCreateMessage
    | TempDmDefs.LogDeleteMessage
    | {$type: string; [k: string]: unknown}
  )[]
  [k: string]: unknown
}

export interface CallOptions {
  headers?: Headers
}

export interface Response {
  success: boolean
  headers: Headers
  data: OutputSchema
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
  }
  return e
}
