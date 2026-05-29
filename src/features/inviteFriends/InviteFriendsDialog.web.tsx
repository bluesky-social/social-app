import {type DialogControlProps} from '#/components/Dialog'

/**
 * Web no-op - the invite-friends share sheet is native-only by design.
 * Callers may still create a Dialog control and pass it; opening it does
 * nothing on web.
 */
export function InviteFriendsDialog(_props: {control: DialogControlProps}) {
  return null
}
