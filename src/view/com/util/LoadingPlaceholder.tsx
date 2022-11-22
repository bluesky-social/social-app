import React, {useEffect, useMemo} from 'react'
import {
  Animated,
  StyleSheet,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UpIcon} from '../../lib/icons'
import {s, colors} from '../../lib/styles'

export function LoadingPlaceholder({
  width,
  height,
  style,
}: {
  width: string | number
  height: string | number
  style?: StyleProp<ViewStyle>
}) {
  const dim = useWindowDimensions()
  const elWidth = typeof width === 'string' ? dim.width : width
  const offset = useMemo(() => new Animated.Value(elWidth * -1), [])
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(offset, {
          toValue: elWidth,
          duration: 1e3,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(offset, {
          toValue: elWidth * -1,
          duration: 0,
          delay: 500,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#e7e9ea',
          borderRadius: 6,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View
        style={{
          width,
          height,
          transform: [{translateX: offset}],
        }}>
        <LinearGradient
          colors={['#e7e9ea', '#e2e2e2', '#e7e9ea']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{width: '100%', height: '100%'}}
        />
      </Animated.View>
    </View>
  )
}

export function PostLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.post, style]}>
      <LoadingPlaceholder width={50} height={50} style={styles.avatar} />
      <View style={[s.flex1]}>
        <LoadingPlaceholder width={100} height={8} style={[s.mb10]} />
        <LoadingPlaceholder width={200} height={8} style={[s.mb5]} />
        <LoadingPlaceholder width={200} height={8} style={[s.mb5]} />
        <LoadingPlaceholder width={120} height={8} style={[s.mb10]} />
        <View style={s.flexRow}>
          <View style={s.flex1}>
            <FontAwesomeIcon
              style={s.gray3}
              icon={['far', 'comment']}
              size={16}
            />
          </View>
          <View style={s.flex1}>
            <FontAwesomeIcon style={s.gray3} icon="retweet" size={20} />
          </View>
          <View style={s.flex1}>
            <UpIcon style={s.gray3} size={19} strokeWidth={1.7} />
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
  return (
    <View style={[styles.notification, style]}>
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
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: 10,
    margin: 1,
  },
  avatar: {
    borderRadius: 25,
    marginRight: 10,
  },
  notification: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: 10,
    paddingLeft: 46,
    margin: 1,
  },
  smallAvatar: {
    borderRadius: 15,
    marginRight: 10,
  },
})
