import {lexicons} from '@atproto/api/src/client/lexicons'
import {hasProp, isObj} from '@atproto/api/src/client/util'
import {ValidationResult} from '@atproto/lexicon'
import {Headers, XRPCError} from '@atproto/xrpc'

import * as TempDmDefs from './defs'

export interface QueryParams {}

export interface InputSchema {
  items: BatchItem[]
  [k: string]: unknown
}

export interface OutputSchema {
  items: TempDmDefs.MessageView[]
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

export interface BatchItem {
  chatId: string
  message: TempDmDefs.Message
  [k: string]: unknown
}

export function isBatchItem(v: unknown): v is BatchItem {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    v.$type === 'temp.dm.sendMessageBatch#batchItem'
  )
}

export function validateBatchItem(v: unknown): ValidationResult {
  return lexicons.validate('temp.dm.sendMessageBatch#batchItem', v)
}
