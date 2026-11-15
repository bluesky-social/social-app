import {type app} from '#/lexicons'

export type CommonProps = {
  view: app.bsky.embed.external.ViewExternal
}

export type PreviewProps = {
  /**
   * Indicates the card is showing the composer. Interactive elements should be
   * disabled when this value is true.
   */
  preview?: boolean
}

export type PublicApiProps = {
  /**
   * Passed down from feed contexts etc, used to fire off interaction tracking
   */
  onEmbedInteractionCallback?: () => void
}

export type ThemeColors = {
  custom: boolean
  accent: string
  accentForeground: string
}
