import {View} from 'react-native'

import {AnnouncementDialogOuter} from '#/components/dialogs/BlockingAnnouncements/AnnouncementDialog'
import * as PolicyUpdate20250801 from '#/components/dialogs/BlockingAnnouncements/PolicyUpdate20250801'
import {createPortalGroup} from '#/components/Portal'

const portalGroup = createPortalGroup()

export const Provider = portalGroup.Provider
export const Portal = portalGroup.Portal

export function Outlet() {
  return (
    <View style={{zIndex: 9999}}>
      <portalGroup.Outlet />
    </View>
  )
}

export function BlockingAnnouncements() {
  const policyUpdate20250801 = PolicyUpdate20250801.useLocalState()

  /*
   * See `window.clearNux` example in `/state/queries/nuxs` for a way to clear
   * NUX state for local testing and debugging.
   */

  if (policyUpdate20250801.completed) return null

  return (
    <Portal>
      <AnnouncementDialogOuter>
        <PolicyUpdate20250801.Announcement />
      </AnnouncementDialogOuter>
    </Portal>
  )
}
