import React from 'react'
import {StyleSheet, StyleProp, View, ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {HeartIcon} from '../../lib/icons'
import {s} from '../../lib/styles'
import {useTheme} from '../../lib/ThemeContext'
import {usePalette} from '../../lib/hooks/usePalette'

export function LoadingPlaceholder({
  width,
  height,
  style,
}: {
  width: string | number
  height: string | number
  style?: StyleProp<ViewStyle>
}) {
  const theme = useTheme()
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: theme.palette.default.backgroundLight,
          borderRadius: 6,
          overflow: 'hidden',
        },
        style,
      ]}>
      <View
        style={{
          width,
          height,
          backgroundColor: theme.palette.default.backgroundLight,
        }}
      />
    </View>
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
      <LoadingPlaceholder width={52} height={52} style={styles.avatar} />
      <View style={[s.flex1]}>
        <LoadingPlaceholder width={100} height={8} style={[s.mb10]} />
        <LoadingPlaceholder width={200} height={8} style={[s.mb5]} />
        <LoadingPlaceholder width={200} height={8} style={[s.mb5]} />
        <LoadingPlaceholder width={120} height={8} style={[s.mb10]} />
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
              style={{color: theme.palette.default.icon}}
              size={17}
              strokeWidth={1.7}
            />
          </View>
          <View style={s.flex1}></View>
        </View>
      </View>
    </View>
  )
}

export function PostFeedLoadingPlaceholder() {
  return (
    <>
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
    </>
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
      <View style={[s.flexRow, s.mb10]}>
        <LoadingPlaceholder width={30} height={30} style={styles.smallAvatar} />
      </View>
      <LoadingPlaceholder width={200} height={8} style={[s.mb5]} />
      <LoadingPlaceholder width={120} height={8} style={[s.mb5]} />
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

const styles = StyleSheet.create({
  post: {
    flexDirection: 'row',
    padding: 10,
    margin: 1,
  },
  avatar: {
    borderRadius: 26,
    marginRight: 10,
    marginLeft: 6,
  },
  notification: {
    padding: 10,
    paddingLeft: 46,
    margin: 1,
  },
  smallAvatar: {
    borderRadius: 15,
    marginRight: 10,
  },
})
