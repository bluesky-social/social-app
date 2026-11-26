export type InstagramStoryOptions = {
  /** The Facebook App ID. Instagram rejects stories without a registered one. */
  appId: string
  /** A local file URI for a full-screen image, 9:16 and at least 720x1280. */
  backgroundImage?: string
  /**
   * A local file URI for an image laid over the background, which the person
   * can move and resize.
   */
  stickerImage?: string
  /** Hex colors for a gradient behind the sticker, when there's no background. */
  backgroundTopColor?: string
  backgroundBottomColor?: string
}
