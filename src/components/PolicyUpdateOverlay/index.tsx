import {View} from 'react-native'

import {isIOS} from '#/platform/detection'
import {atoms as a} from '#/alf'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {usePolicyUpdateStateContext} from '#/components/PolicyUpdateOverlay/context'
import {Portal} from '#/components/PolicyUpdateOverlay/Portal'
import {Content} from '#/components/PolicyUpdateOverlay/updates/202508'

export {Provider} from '#/components/PolicyUpdateOverlay/context'
export {usePolicyUpdateStateContext} from '#/components/PolicyUpdateOverlay/context'
export {Outlet} from '#/components/PolicyUpdateOverlay/Portal'

export function PolicyUpdateOverlay() {
  const state = usePolicyUpdateStateContext()

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
