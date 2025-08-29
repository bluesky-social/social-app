import {type GeneratedAlways, type Selectable} from 'kysely'

export type DbSchema = {
  link: Link
  safelink_rule: SafelinkRule
  safelink_cursor: SafelinkCursor
}

export interface Link {
  id: string
  type: LinkType
  path: string
}

export enum LinkType {
  StarterPack = 1,
}

export type RuleEventType =
  | 'addRule'
  | 'updateRule'
  | 'removeRule'
  | (string & {})
export type RulePatternType = 'domain' | 'url' | (string & {})
export type RuleActionType = 'block' | 'warn' | 'whitelist' | (string & {})
export type RuleReasonType =
  | 'csam'
  | 'spam'
  | 'phishing'
  | 'none'
  | (string & {})

export interface SafelinkRule {
  id: number
  eventType: RuleEventType
  url: string
  pattern: RulePatternType
  action: RuleActionType
  reason: RuleReasonType
  createdBy: string
  createdAt: string
  comment?: string
}

export interface SafelinkCursor {
  id: GeneratedAlways<number>
  cursor: string
  createdAt: Date
}

export type LinkEntry = Selectable<Link>
export type SafelinkRuleEntry = Selectable<SafelinkRule>
export type SafelinkCursorEntry = Selectable<SafelinkCursor>
