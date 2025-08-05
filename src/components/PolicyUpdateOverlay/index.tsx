import {View} from 'react-native'

import {isIOS} from '#/platform/detection'
import {atoms as a} from '#/alf'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {Content} from '#/components/PolicyUpdateOverlay/updates/202508'
import {usePolicyUpdateState} from '#/components/PolicyUpdateOverlay/usePolicyUpdateState'
import {createPortalGroup} from '#/components/Portal'

const portalGroup = createPortalGroup()

export const Provider = portalGroup.Provider
export const Portal = portalGroup.Portal
export const Outlet = portalGroup.Outlet

export function PolicyUpdateOverlay() {
  const state = usePolicyUpdateState()

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
          <Content state={state} />
        </View>
      </FullWindowOverlay>
    </Portal>
  )
}
