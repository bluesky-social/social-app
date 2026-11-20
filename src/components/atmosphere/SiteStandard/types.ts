export type PreviewProps = {
  /**
   * Indicates the card is showing the composer. Interactive elements should be
   * disabled when this value is true.
   */
  preview?: boolean
}

export type PublicApiProps = {
  /** Called when the card's primary link is pressed. */
  onPressCallback?: () => void
  /** Called when a native long press opens the share sheet. */
  onShareCallback?: () => void
}
