import {Headers, XRPCError} from '@atproto/xrpc'

import * as TempDmDefs from './defs'

export interface QueryParams {
  members: string[]
}

export type InputSchema = undefined

export interface OutputSchema {
  chat: TempDmDefs.ChatView
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
