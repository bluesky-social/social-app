import React from 'react'
import {
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  DimensionValue,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {HeartIcon, HeartIconSolid} from 'lib/icons'
import {s} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'

export function LoadingPlaceholder({
  width,
  height,
  style,
}: {
  width: DimensionValue
  height: DimensionValue
  style?: StyleProp<ViewStyle>
}) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.loadingPlaceholder,
        {
          width,
          height,
          backgroundColor: theme.palette.default.backgroundLight,
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
  const theme = useTheme()
  const pal = usePalette('default')
  return (
    <View style={[styles.post, pal.view, style]}>
      <LoadingPlaceholder
        width={52}
        height={52}
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
        <LoadingPlaceholder width="80%" height={6} style={{marginBottom: 15}} />
        <View style={s.flexRow}>
          <View style={s.flex1}>
            <FontAwesomeIcon
              style={{color: theme.palette.default.icon}}
              icon={['far', 'comment']}
              size={14}
            />
          </View>
          <View style={s.flex1}>
            <FontAwesomeIcon
              style={{color: theme.palette.default.icon}}
              icon="retweet"
              size={18}
            />
          </View>
          <View style={s.flex1}>
            <HeartIcon
              style={{color: theme.palette.default.icon} as ViewStyle}
              size={17}
              strokeWidth={1.7}
            />
          </View>
          <View style={s.flex1} />
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
  const pal = usePalette('default')
  return (
    <View style={[styles.notification, pal.view, style]}>
      <View style={{paddingLeft: 30, paddingRight: 10}}>
        <HeartIconSolid
          style={{color: pal.colors.backgroundLight} as ViewStyle}
          size={30}
        />
      </View>
      <View style={{flex: 1}}>
        <View style={[s.flexRow, s.mb10]}>
          <LoadingPlaceholder
            width={30}
            height={30}
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
  const pal = usePalette('default')
  return (
    <View style={[styles.profileCard, pal.view, style]}>
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
  const pal = usePalette('default')
  return (
    <View
      style={[
        {
          paddingHorizontal: 12,
          paddingVertical: 18,
          borderTopWidth: showTopBorder ? 1 : 0,
        },
        pal.border,
        style,
      ]}>
      <View style={[pal.view, {flexDirection: 'row'}]}>
        <LoadingPlaceholder
          width={36}
          height={36}
          style={[styles.avatar, {borderRadius: 6}]}
        />
        <View style={[s.flex1]}>
          <LoadingPlaceholder width={100} height={8} style={[s.mt5, s.mb10]} />
          <LoadingPlaceholder width={120} height={8} />
        </View>
      </View>
      {showLowerPlaceholder && (
        <View style={{paddingHorizontal: 5, marginTop: 10}}>
          <LoadingPlaceholder
            width={260}
            height={8}
            style={{marginVertical: 12}}
          />
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
  },
  avatar: {
    borderRadius: 26,
    marginRight: 10,
    marginLeft: 8,
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
    borderRadius: 20,
    marginRight: 10,
  },
  smallAvatar: {
    borderRadius: 15,
    marginRight: 10,
  },
})
