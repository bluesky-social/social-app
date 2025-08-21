import {Selectable} from 'kysely'

export type DbSchema = {
  link: Link
  safelink_rule: SafelinkRule
}

export interface Link {
  id: string
  type: LinkType
  path: string
}

export enum LinkType {
  StarterPack = 1,
}

export type RuleEventType = '#addRule' | '#updateRule' | '#removeRule'
export type RulePatternType = '#domain' | '#url'
export type RuleActionType = '#block' | '#warn' | '#whitelist'
export type RuleReasonType = '#csam' | '#spam' | '#phishing' | '#none'

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

export type LinkEntry = Selectable<Link>
export type RuleEntry = Selectable<SafelinkRule>
