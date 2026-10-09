import {useState} from 'react'
import {View} from 'react-native'

import {
  createGroupedNotificationsFixture,
  VIEWER_DID,
} from '#/state/queries/notifications/grouped/__fixtures__'
import {hydratePage} from '#/state/queries/notifications/grouped/hydrate'
import {
  FollowedYouHeader,
  FollowerNotification,
  getFollowers,
  isFollowerNotification,
  NotificationItem,
} from '#/screens/Notifications/components/NotificationItem'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {H1, H3} from '#/components/Typography'

type ReadState = 'fixture' | 'unread' | 'read'

/**
 * Every Notifications v2 row kind, rendered from the grouped notifications
 * fixtures, then the follow fixtures as the Followers tab shows them.
 */
export function Notifications() {
  const t = useTheme()
  const [readState, setReadState] = useState<ReadState>('fixture')
  const [{notifications}] = useState(() =>
    hydratePage(createGroupedNotificationsFixture(), {viewerDid: VIEWER_DID}),
  )

  return (
    <View style={[a.gap_md]}>
      <H1>Notifications</H1>
      <View style={[a.flex_row, a.gap_sm]}>
        {(['fixture', 'unread', 'read'] as const).map(state => (
          <Button
            key={state}
            label={state}
            size="small"
            color={readState === state ? 'primary' : 'secondary'}
            onPress={() => setReadState(state)}>
            <ButtonText>{state}</ButtonText>
          </Button>
        ))}
      </View>
      <View
        style={[
          a.border,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.border_contrast_low,
        ]}>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={
              readState === 'fixture'
                ? notification
                : {...notification, isRead: readState === 'read'}
            }
          />
        ))}
      </View>
      <H3>Followers tab</H3>
      <View
        style={[
          a.border,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.border_contrast_low,
        ]}>
        <FollowedYouHeader />
        {notifications
          .filter(isFollowerNotification)
          .flatMap(notification =>
            getFollowers(notification).map(profile => (
              <FollowerNotification
                key={`${notification.id}-${profile.did}`}
                notification={notification}
                profile={profile}
              />
            )),
          )}
      </View>
    </View>
  )
}
