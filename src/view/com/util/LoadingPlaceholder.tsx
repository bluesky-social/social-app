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
import {Box, useTokens} from '#/alf'

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
  const tokens = useTokens()
  return (
    <Box bg='l0' row px='m' pt='xl' pb='xs'>
      <Box
        bg='l1'
        width={52}
        height={52}
        radius='round'
        mr='m'
        ml='s'
        top={-6}
      />
      <Box flex={1}>
        <Box gap='s'>
          <Box bg='l1' width={100} height={6} radius='s' />
          <Box bg='l1' width="95%" height={6} radius='s' />
          <Box bg='l1' width="95%" height={6} radius='s' />
          <Box bg='l1' width="80%" height={6} radius='s' mb='s' />
        </Box>
        <Box row>
          <Box column>
            <FontAwesomeIcon
              style={{color: tokens.color.l2}}
              icon={['far', 'comment']}
              size={14}
            />
          </Box>
          <Box column>
            <FontAwesomeIcon
              style={{color: tokens.color.l2}}
              icon="retweet"
              size={18}
            />
          </Box>
          <Box column>
            <HeartIcon
              style={{color: tokens.color.l2}}
              size={17}
              strokeWidth={1.7}
            />
          </Box>
          <Box column />
        </Box>
      </Box>
    </Box>
  )
}

export function PostFeedLoadingPlaceholder() {
  return (
    <Box>
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
    </Box>
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
