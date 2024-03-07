export interface ConfirmDialogOptions {
  title: string
  description?: string
  cancel?: string
  confirm?: string
  onConfirm?: () => unknown
}
