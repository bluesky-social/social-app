import {type ViewStyleProp} from '#/alf'

export type ProfileHoverCardProps = ViewStyleProp & {
  children: React.ReactNode
  did: string
  disable?: boolean
  inline?: boolean
  /**
   * Called after following the profile from the card. Feed items use it to
   * send feed feedback, since the card renders in a portal outside their feed.
   */
  onFollow?: () => void
}
