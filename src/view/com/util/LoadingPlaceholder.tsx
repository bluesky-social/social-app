import {useMemo} from 'react'
import {
  type DimensionValue,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'

import {s} from '#/lib/styles'
import {atoms as a, useTheme} from '#/alf'
import {Bubble_Stroke2_Corner2_Rounded as Bubble} from '#/components/icons/Bubble'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartIconOutline,
} from '#/components/icons/Heart2'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'

export function LoadingPlaceholder({
  width,
  height,
  style,
}: {
  width: DimensionValue
  height: DimensionValue | undefined
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <View
      style={[
        styles.loadingPlaceholder,
        {
          width,
          height,
          backgroundColor: t.palette.contrast_50,
        },
        style,
      ]}
    />
  )
}

export function PostLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <View style={[styles.post, style]}>
      <LoadingPlaceholder
        width={42}
        height={42}
        style={[
          styles.avatar,
          {
            position: 'relative',
            top: -6,
          },
        ]}
      />
      <View style={[s.flex1]}>
        <LoadingPlaceholder width={100} height={6} style={{marginBottom: 10}} />
        <LoadingPlaceholder width="95%" height={6} style={{marginBottom: 8}} />
        <LoadingPlaceholder width="95%" height={6} style={{marginBottom: 8}} />
        <LoadingPlaceholder width="80%" height={6} style={{marginBottom: 11}} />
        <View style={styles.postCtrls}>
          <View style={[styles.postCtrl, {marginLeft: -6}]}>
            <View style={styles.postBtn}>
              <Bubble
                style={[
                  {
                    color: t.palette.contrast_500,
                  },
                  {pointerEvents: 'none'},
                ]}
                width={18}
              />
            </View>
          </View>
          <View style={styles.postCtrl}>
            <View style={styles.postBtn}>
              <Repost
                style={[
                  {
                    color: t.palette.contrast_500,
                  },
                  {pointerEvents: 'none'},
                ]}
                width={18}
              />
            </View>
          </View>
          <View style={styles.postCtrl}>
            <View style={styles.postBtn}>
              <HeartIconOutline
                style={[
                  {
                    color: t.palette.contrast_500,
                  },
                  {pointerEvents: 'none'},
                ]}
                width={18}
              />
            </View>
          </View>
          <View style={styles.postCtrl}>
            <View style={[styles.postBtn, {minHeight: 30}]} />
          </View>
        </View>
      </View>
    </View>
  )
}

export function PostFeedLoadingPlaceholder() {
  return (
    <View>
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
    </View>
  )
}

export function NotificationLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <View style={[styles.notification, style]}>
      <View style={[{width: 60}, a.align_end, a.pr_sm, a.pt_2xs]}>
        <HeartIconFilled size="xl" style={{color: t.palette.contrast_50}} />
      </View>
      <View style={{flex: 1}}>
        <View style={[a.flex_row, s.mb10]}>
          <LoadingPlaceholder
            width={35}
            height={35}
            style={styles.smallAvatar}
          />
        </View>
        <LoadingPlaceholder width="90%" height={6} style={[s.mb5]} />
        <LoadingPlaceholder width="70%" height={6} style={[s.mb5]} />
      </View>
    </View>
  )
}

export function NotificationFeedLoadingPlaceholder() {
  return (
    <>
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
    </>
  )
}

export function ProfileCardLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.profileCard, style]}>
      <LoadingPlaceholder
        width={40}
        height={40}
        style={styles.profileCardAvi}
      />
      <View>
        <LoadingPlaceholder width={140} height={8} style={[s.mb5]} />
        <LoadingPlaceholder width={120} height={8} style={[s.mb10]} />
        <LoadingPlaceholder width={220} height={8} style={[s.mb5]} />
      </View>
    </View>
  )
}

export function ProfileCardFeedLoadingPlaceholder() {
  return (
    <>
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
    </>
  )
}

export function FeedLoadingPlaceholder({
  style,
  showLowerPlaceholder = true,
  showTopBorder = true,
}: {
  style?: StyleProp<ViewStyle>
  showTopBorder?: boolean
  showLowerPlaceholder?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        {
          padding: 16,
          borderTopWidth: showTopBorder ? StyleSheet.hairlineWidth : 0,
        },
        t.atoms.border_contrast_low,
        style,
      ]}>
      <View style={[{flexDirection: 'row'}]}>
        <LoadingPlaceholder
          width={36}
          height={36}
          style={[styles.avatar, {borderRadius: 8}]}
        />
        <View style={[s.flex1]}>
          <LoadingPlaceholder width={100} height={8} style={[s.mt5, s.mb10]} />
          <LoadingPlaceholder width={120} height={8} />
        </View>
      </View>
      {showLowerPlaceholder && (
        <View style={{marginTop: 12}}>
          <LoadingPlaceholder width={120} height={8} />
        </View>
      )}
    </View>
  )
}

export function FeedFeedLoadingPlaceholder() {
  return (
    <>
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
    </>
  )
}

export function ChatListItemLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const random = useMemo(() => Math.random(), [])
  return (
    <View style={[a.flex_row, a.gap_md, a.px_lg, a.mt_lg, t.atoms.bg, style]}>
      <LoadingPlaceholder width={52} height={52} style={a.rounded_full} />
      <View>
        <LoadingPlaceholder width={140} height={12} style={a.mt_xs} />
        <LoadingPlaceholder width={120} height={8} style={a.mt_sm} />
        <LoadingPlaceholder
          width={80 + random * 100}
          height={8}
          style={a.mt_sm}
        />
      </View>
    </View>
  )
}

export function ChatListLoadingPlaceholder() {
  return (
    <>
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
      <ChatListItemLoadingPlaceholder />
    </>
  )
}

const styles = StyleSheet.create({
  loadingPlaceholder: {
    borderRadius: 6,
  },
  post: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 5,
    paddingRight: 15,
  },
  postCtrls: {
    opacity: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postCtrl: {
    flex: 1,
  },
  postBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  avatar: {
    borderRadius: 999,
    marginRight: 12,
  },
  notification: {
    flexDirection: 'row',
    padding: 10,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 10,
    margin: 1,
  },
  profileCardAvi: {
    borderRadius: 999,
    marginRight: 10,
  },
  smallAvatar: {
    borderRadius: 999,
    marginRight: 10,
  },
})
