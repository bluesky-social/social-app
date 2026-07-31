import {type ConvoItem} from '#/state/messages/convo/types'
import {localDateString, MESSAGE_GAP_THRESHOLD_MS} from '#/components/dms/util'

export type SystemMessageItem = Extract<ConvoItem, {type: 'system-message'}>

export type SystemMessageGroupItem = {
  type: 'system-message-group'
  key: string
  items: SystemMessageItem[]
}

export type SystemMessageDateDividerItem = {
  type: 'system-message-date-divider'
  key: string
  sentAt: string
}

export type RenderItem =
  | ConvoItem
  | SystemMessageGroupItem
  | SystemMessageDateDividerItem

function getSentAt(item: ConvoItem): string | null {
  if (
    item.type === 'message' ||
    item.type === 'pending-message' ||
    item.type === 'deleted-message' ||
    item.type === 'system-message'
  ) {
    return item.message.sentAt
  }
  return null
}

export function groupSystemMessages(items: ConvoItem[]): RenderItem[] {
  const result: RenderItem[] = []
  let run: SystemMessageItem[] = []
  let lastSentAt: string | null = null
  let runAnchor: string | null = null

  const flush = () => {
    if (run.length === 0) return

    const firstSentAt = run[0].message.sentAt
    const hasLargeGap =
      runAnchor === null ||
      new Date(firstSentAt).getTime() - new Date(runAnchor).getTime() >
        MESSAGE_GAP_THRESHOLD_MS

    if (hasLargeGap) {
      result.push({
        type: 'system-message-date-divider',
        key: `system-message-date-divider:${run[0].key}`,
        sentAt: firstSentAt,
      })
    }

    if (run.length < 4) {
      for (const item of run) result.push(item)
    } else {
      // Key off the first member's id so the key stays stable when a new
      // system message arrives at the end of the run (the common case).
      // Trade-off: If older history pagination prepends a system message
      // that extends the run backward, the first member changes and this
      // group collapses.
      result.push({
        type: 'system-message-group',
        key: `system-message-group:${run[0].key}`,
        items: run,
      })
    }
    run = []
  }

  for (const item of items) {
    if (item.type === 'system-message') {
      const day = localDateString(new Date(item.message.sentAt))
      const lastDay =
        run.length > 0
          ? localDateString(new Date(run[run.length - 1].message.sentAt))
          : null
      if (lastDay !== null && lastDay !== day) {
        flush()
      }
      if (run.length === 0) {
        runAnchor = lastSentAt
      }
      run.push(item)
    } else {
      flush()
      result.push(item)
    }

    const sentAt = getSentAt(item)
    if (sentAt) lastSentAt = sentAt
  }
  flush()

  return result
}
