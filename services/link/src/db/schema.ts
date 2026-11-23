import {type ToolsOzoneSafelinkDefs} from '@atproto/api'
import {type Selectable} from 'kysely'

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

export interface SafelinkRule {
  id: number
  eventType: ToolsOzoneSafelinkDefs.EventType
  url: string
  pattern: ToolsOzoneSafelinkDefs.PatternType
  action: ToolsOzoneSafelinkDefs.ActionType
  createdAt: string
}

export interface SafelinkCursor {
  id: number
  cursor: string
  updatedAt: Date
}

export type LinkEntry = Selectable<Link>
export type SafelinkRuleEntry = Selectable<SafelinkRule>
export type SafelinkCursorEntry = Selectable<SafelinkCursor>
