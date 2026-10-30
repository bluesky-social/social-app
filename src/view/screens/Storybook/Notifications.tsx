import {useState} from 'react'
import {View} from 'react-native'

import {
  createGroupedNotificationsFixture,
  VIEWER_DID,
} from '#/state/queries/notifications/grouped/__fixtures__'
import {hydratePage} from '#/state/queries/notifications/grouped/hydrate'
import {type NotificationView} from '#/state/queries/notifications/grouped/types'
import {
  FollowedYouHeader,
  FollowerNotification,
  getFollowers,
  isFollowerNotification,
  NotificationItem,
} from '#/screens/Notifications/components/NotificationItem'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  AUTHORS,
  MEDIA,
  postWith,
  QUOTE_PLACEHOLDERS,
  QUOTES,
} from '#/components/Post/Embed/__fixtures__'
import {H1, H3} from '#/components/Typography'

type ReadState = 'fixture' | 'unread' | 'read'

/**
 * Every Notifications v2 row kind, rendered from the grouped notifications
 * fixtures, then quotes and media from the embed fixtures, then the follow
 * fixtures as the Followers tab shows them.
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
      <H3>Quotes and media</H3>
      <View
        style={[
          a.border,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.border_contrast_low,
        ]}>
        {MEDIA_NOTIFICATIONS.map(notification => (
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

/**
 * Someone quoting each of the embed fixtures' quoted posts, then likes and
 * mentions whose own media shows as a square: trailing for likes, in place
 * of the text for mentions.
 */
const MEDIA_NOTIFICATIONS: NotificationView[] = [
  ...[...QUOTES, ...QUOTE_PLACEHOLDERS].map(
    ({title, embed}, i): NotificationView => ({
      type: 'quote',
      id: `story-quote-${i}`,
      isRead: i % 2 === 1,
      indexedAt: new Date(Date.now() - (i + 1) * 60_000).toISOString(),
      count: 1,
      post: postWith({rkey: `story-quote-${i}`, text: title, embed}),
    }),
  ),
  ...(
    [
      ['Quote only', QUOTES[2].embed],
      ['Video', MEDIA.video],
      ['GIF (video)', MEDIA.videoGif],
      ['GIF (Tenor link)', MEDIA.tenorGif],
      ['Three images', MEDIA.threeImages],
    ] as const
  ).map(([title, embed], i): NotificationView => ({
    type: 'like',
    id: `story-like-${i}`,
    isRead: false,
    indexedAt: new Date(Date.now() - (i + 30) * 60_000).toISOString(),
    count: 1,
    actors: [AUTHORS.ines],
    actorDids: [AUTHORS.ines.did],
    post: postWith({
      author: AUTHORS.priya,
      rkey: `story-like-${i}`,
      text: title === 'Quote only' ? '' : title,
      embed,
    }),
  })),
  ...[MEDIA.video, MEDIA.videoGif].map((embed, i): NotificationView => ({
    type: 'mention',
    id: `story-mention-${i}`,
    isRead: true,
    indexedAt: new Date(Date.now() - (i + 40) * 60_000).toISOString(),
    count: 1,
    post: postWith({rkey: `story-mention-${i}`, text: '', embed}),
  })),
]
