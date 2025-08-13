import {View} from 'react-native'
import {toast as sonner, Toaster} from 'sonner-native'

import {atoms as a} from '#/alf'
import {DEFAULT_TOAST_DURATION} from '#/components/Toast/const'
import {Toast} from '#/components/Toast/Toast'
import {type ToastApi} from '#/components/Toast/types'

function ToastOuter({children}: {children: React.ReactNode}) {
  return <View style={[a.px_xl, a.w_full]}>{children}</View>
}

export function ToastOutlet() {
  return <Toaster pauseWhenPageIsHidden gap={a.gap_sm.gap} />
}

export const toast: ToastApi = {
  show(props) {
    sonner.custom(
      <ToastOuter>
        <Toast content={props.content} type={props.type} />
      </ToastOuter>,
      {
        duration: props.duration ?? DEFAULT_TOAST_DURATION,
      },
    )
  },
}
