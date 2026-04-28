import {type ConvoItem} from '#/state/messages/convo/types'
import {localDateString} from '#/components/dms/util'

export type SystemMessageItem = Extract<ConvoItem, {type: 'system-message'}>

export type SystemMessageGroupItem = {
  type: 'system-message-group'
  key: string
  items: SystemMessageItem[]
}

export type RenderItem = ConvoItem | SystemMessageGroupItem

export function groupSystemMessages(items: ConvoItem[]): RenderItem[] {
  const result: RenderItem[] = []
  let run: SystemMessageItem[] = []

  const flush = () => {
    if (run.length === 0) return
    if (run.length === 1) {
      result.push(run[0])
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
      run.push(item)
    } else {
      flush()
      result.push(item)
    }
  }
  flush()

  return result
}
