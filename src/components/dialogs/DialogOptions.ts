import {ButtonColor} from '#/components/Button'

export interface ConfirmDialogOptions {
  title: string
  description?: string
  cancel?: string
  confirm?: string
  confirmColor?: ButtonColor
  onConfirm?: () => unknown
}
