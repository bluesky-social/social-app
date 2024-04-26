import {AppBskyEmbedRecord, AppBskyRichtextFacet} from '@atproto/api'

export interface Chat {
  chatId: string
  messages: Message[]
  lastCursor: string
  lastRev: string
}

export interface Message {
  id: string
  text: string
  facets?: AppBskyRichtextFacet.Main[]
  embed?: AppBskyEmbedRecord.Main | {$type: string; [k: string]: unknown}
  [k: string]: unknown
}

export interface ChatMessages {
  messages: Message[]
}

// Needs better typing later
export interface ChatLog {
  cursor: string
  logs: {
    $type: 'temp.dm.defs#logCreateMessage' | string
    chatId: string
    rev: string
    message: Message
  }[]
}
