import {toast as sonner, Toaster} from 'sonner'

import {atoms as a} from '#/alf'
import {DEFAULT_TOAST_DURATION} from '#/components/Toast/const'
import {Toast} from '#/components/Toast/Toast'
import {type ToastApi} from '#/components/Toast/types'

export function ToastOutlet() {
  return (
    <Toaster
      position="bottom-left"
      gap={a.gap_sm.gap}
      offset={a.p_xl.padding}
      mobileOffset={a.p_xl.padding}
    />
  )
}

export const toast: ToastApi = {
  show(props) {
    sonner(<Toast content={props.content} type={props.type} />, {
      duration: props.duration ?? DEFAULT_TOAST_DURATION,
      unstyled: true,
    })
  },
}
