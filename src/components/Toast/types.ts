export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export type ToastApi = {
  show: (props: {
    type: ToastType
    content: React.ReactNode
    a11yLabel: string
  }) => void
}
