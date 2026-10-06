import {type BlobRef} from '@atproto/lex'

export type ProfileLink = {
  url: string
  title?: string
  /**
   * The site's favicon, fetched through cardyb and uploaded when the link is
   * saved, so it goes through blob scanning like any other profile image.
   * Support links don't need one; they use bundled logos.
   */
  icon?: BlobRef
}

export const MAX_PROFILE_LINKS = 10

/** Keeps a pill from swallowing the whole row. */
export const MAX_TITLE_LENGTH = 30
