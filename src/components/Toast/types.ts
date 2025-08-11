export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export type ToastApi = {
  show: (props: {
    /**
     * The type of toast to show. This determines the styling and icon used.
     */
    type: ToastType
    /**
     * A string, `Text`, or `Span` components to render inside the toast. This
     * allows additional formatting of the content, but should not be used for
     * interactive elements link links or buttons.
     */
    content: React.ReactNode | string
    /**
     * Accessibility label for the toast, used for screen readers.
     */
    a11yLabel: string
    /**
     * Defaults to `DEFAULT_TOAST_DURATION` from `#components/Toast/const`.
     */
    duration?: number
  }) => void
}
