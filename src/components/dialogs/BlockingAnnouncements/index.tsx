import {View} from 'react-native'

import {Nux} from '#/state/queries/nuxs'
import {atoms as a} from '#/alf'
import * as PolicyUpdate20250801 from '#/components/dialogs/BlockingAnnouncements/PolicyUpdate20250801'
import {useAnnouncementState} from '#/components/dialogs/BlockingAnnouncements/useAnnouncementState'
import {createPortalGroup} from '#/components/Portal'

const portalGroup = createPortalGroup()

export const Provider = portalGroup.Provider
export const Portal = portalGroup.Portal
export const Outlet = portalGroup.Outlet

export function BlockingAnnouncements() {
  const state = useAnnouncementState({
    id: Nux.BlockingAnnouncementPolicyUpdate20250801,
  })

  /*
   * See `window.clearNux` example in `/state/queries/nuxs` for a way to clear
   * NUX state for local testing and debugging.
   */

  if (state.completed) return null

  return (
    <Portal>
      <View style={[a.fixed, a.inset_0, {zIndex: 9999}]}>
        <PolicyUpdate20250801.Announcement state={state} />
      </View>
    </Portal>
  )
}
