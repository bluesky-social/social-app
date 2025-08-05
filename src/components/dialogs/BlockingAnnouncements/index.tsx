import {View} from 'react-native'

import {isIOS} from '#/platform/detection'
import {atoms as a} from '#/alf'
import {Announcement} from '#/components/dialogs/BlockingAnnouncements/announcements/PolicyUpdate202508'
import {useAnnouncementState} from '#/components/dialogs/BlockingAnnouncements/useAnnouncementState'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {createPortalGroup} from '#/components/Portal'

const portalGroup = createPortalGroup()

export const Provider = portalGroup.Provider
export const Portal = portalGroup.Portal
export const Outlet = portalGroup.Outlet

export function BlockingAnnouncements() {
  const state = useAnnouncementState()

  /*
   * See `window.clearNux` example in `/state/queries/nuxs` for a way to clear
   * NUX state for local testing and debugging.
   */

  if (state.completed) return null

  return (
    <Portal>
      <FullWindowOverlay>
        <View
          style={[
            a.fixed,
            a.inset_0,
            // setting a zIndex when using FullWindowOverlay on iOS
            // means the taps pass straight through to the underlying content (???)
            // so don't set it on iOS. FullWindowOverlay already does the job.
            !isIOS && {zIndex: 9999},
          ]}>
          <Announcement state={state} />
        </View>
      </FullWindowOverlay>
    </Portal>
  )
}
