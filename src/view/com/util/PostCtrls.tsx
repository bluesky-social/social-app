import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UpIcon, UpIconSolid, DownIcon, DownIconSolid} from '../../lib/icons'
import {s, colors} from '../../lib/styles'

interface PostCtrlsOpts {
  replyCount: number
  repostCount: number
  upvoteCount: number
  downvoteCount: number
  isReposted: boolean
  isUpvoted: boolean
  isDownvoted: boolean
  onPressReply: () => void
  onPressToggleRepost: () => void
  onPressToggleUpvote: () => void
  onPressToggleDownvote: () => void
}

export function PostCtrls(opts: PostCtrlsOpts) {
  const interp1 = useSharedValue<number>(0)
  const interp2 = useSharedValue<number>(0)
  const interp3 = useSharedValue<number>(0)

  const anim1Style = useAnimatedStyle(() => ({
    transform: [{scale: interpolate(interp1.value, [0, 1.0], [1.0, 3.0])}],
    opacity: interpolate(interp1.value, [0, 1.0], [1.0, 0.0]),
  }))
  const anim2Style = useAnimatedStyle(() => ({
    transform: [{scale: interpolate(interp2.value, [0, 1.0], [1.0, 3.0])}],
    opacity: interpolate(interp2.value, [0, 1.0], [1.0, 0.0]),
  }))
  const anim3Style = useAnimatedStyle(() => ({
    transform: [{scale: interpolate(interp3.value, [0, 1.0], [1.0, 3.0])}],
    opacity: interpolate(interp3.value, [0, 1.0], [1.0, 0.0]),
  }))

  const onPressToggleRepostWrapper = () => {
    if (!opts.isReposted) {
      interp1.value = withTiming(1, {duration: 300}, () => {
        interp1.value = withDelay(100, withTiming(0, {duration: 20}))
      })
    }
    opts.onPressToggleRepost()
  }
  const onPressToggleUpvoteWrapper = () => {
    if (!opts.isUpvoted) {
      interp2.value = withTiming(1, {duration: 300}, () => {
        interp2.value = withDelay(100, withTiming(0, {duration: 20}))
      })
    }
    opts.onPressToggleUpvote()
  }
  const onPressToggleDownvoteWrapper = () => {
    if (!opts.isDownvoted) {
      interp3.value = withTiming(1, {duration: 300}, () => {
        interp3.value = withDelay(100, withTiming(0, {duration: 20}))
      })
    }
    opts.onPressToggleDownvote()
  }

  return (
    <View style={styles.ctrls}>
      <View style={s.flex1}>
        <TouchableOpacity style={styles.ctrl} onPress={opts.onPressReply}>
          <FontAwesomeIcon
            style={styles.ctrlIcon}
            icon={['far', 'comment']}
            size={14}
          />
          <Text style={s.f13}>{opts.replyCount}</Text>
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity
          onPress={onPressToggleRepostWrapper}
          style={styles.ctrl}>
          <Animated.View style={anim1Style}>
            <FontAwesomeIcon
              style={
                opts.isReposted ? styles.ctrlIconReposted : styles.ctrlIcon
              }
              icon="retweet"
              size={18}
            />
          </Animated.View>
          <Text
            style={
              opts.isReposted
                ? [s.bold, s.green3, s.f13, s.ml5]
                : [s.f13, s.ml5]
            }>
            {opts.repostCount}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity
          style={styles.ctrl}
          onPress={onPressToggleUpvoteWrapper}>
          <Animated.View style={anim2Style}>
            {opts.isUpvoted ? (
              <UpIconSolid style={styles.ctrlIconUpvoted} size={18} />
            ) : (
              <UpIcon style={styles.ctrlIcon} size={18} />
            )}
          </Animated.View>
          <Text
            style={
              opts.isUpvoted ? [s.bold, s.red3, s.f13, s.ml5] : [s.f13, s.ml5]
            }>
            {opts.upvoteCount}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity
          style={styles.ctrl}
          onPress={onPressToggleDownvoteWrapper}>
          <Animated.View style={anim3Style}>
            {opts.isDownvoted ? (
              <DownIconSolid style={styles.ctrlIconDownvoted} size={18} />
            ) : (
              <DownIcon style={styles.ctrlIcon} size={18} />
            )}
          </Animated.View>
          <Text
            style={
              opts.isDownvoted
                ? [s.bold, s.blue3, s.f13, s.ml5]
                : [s.f13, s.ml5]
            }>
            {opts.downvoteCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  ctrls: {
    flexDirection: 'row',
  },
  ctrl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  ctrlIcon: {
    color: colors.gray5,
  },
  ctrlIconReposted: {
    color: colors.green3,
  },
  ctrlIconUpvoted: {
    color: colors.red3,
  },
  ctrlIconDownvoted: {
    color: colors.blue3,
  },
})
