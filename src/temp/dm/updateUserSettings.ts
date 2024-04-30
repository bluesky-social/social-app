import {Headers, XRPCError} from '@atproto/xrpc'

import * as TempDmDefs from './defs'

export interface QueryParams {}

export interface InputSchema {
  allowIncoming?: TempDmDefs.IncomingMessageSetting
  [k: string]: unknown
}

export interface OutputSchema {
  allowIncoming: TempDmDefs.IncomingMessageSetting
  [k: string]: unknown
}

export interface CallOptions {
  headers?: Headers
  qp?: QueryParams
  encoding: 'application/json'
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
