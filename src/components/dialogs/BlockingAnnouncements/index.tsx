import {AnnouncementDialogOuter} from '#/components/dialogs/BlockingAnnouncements/AnnouncementDialog'
import * as PolicyUpdate20250801 from '#/components/dialogs/BlockingAnnouncements/PolicyUpdate20250801'

export function BlockingAnnouncements() {
  const policyUpdate20250801 = PolicyUpdate20250801.useLocalState()

  /*
   * See `window.clearNux` example in `/state/queries/nuxs` for a way to clear
   * NUX state for local testing and debugging.
   */

  if (policyUpdate20250801.completed) return null

  return (
    <AnnouncementDialogOuter>
      <PolicyUpdate20250801.Announcement />
    </AnnouncementDialogOuter>
  )
}
