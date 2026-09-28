import {useNotificationFeedTop} from '#/state/queries/notifications/feed'
import {useLastUnreadCheck} from '#/state/queries/notifications/unread'
import {
  NewPostsPill,
  useScreenHeaderPillPlacement,
} from '#/components/NewPostsPill'
import {isNotificationsPillOffered} from '#/features/followingV2/notificationsPillOffer'

/**
 * The text "New" pill on a Notifications tab, offering unread notifications
 * the tab's list has not loaded; see `isNotificationsPillOffered`. Pressing it
 * is the caller's refresh-and-reveal.
 *
 * Impression and press events come with the rest of the pill's metrics
 * (APP-3101); until then this reports nothing.
 *
 * @platform ios, android
 */
export function NotificationsNewPill({
  filter,
  isActive,
  onPress,
}: {
  filter: 'all' | 'mentions'
  /**
   * Whether this is the tab in view: the screen is focused and the pager is
   * on it. Nothing else shows the pill, so an offscreen tab has no impression
   * to give.
   */
  isActive: boolean
  onPress: () => void
}) {
  const check = useLastUnreadCheck()
  const top = useNotificationFeedTop(filter)
  /*
   * The tab bar sits in the flow above the pager, so a tab's own box already
   * begins below it: there is no header layout to attach.
   */
  const placement = useScreenHeaderPillPlacement()

  return (
    <NewPostsPill
      visible={isActive && isNotificationsPillOffered({filter, check, top})}
      variant="new"
      style={placement.style}
      testID="notificationsNewPill"
      onPress={onPress}
    />
  )
}
