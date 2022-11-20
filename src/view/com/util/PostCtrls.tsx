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
import {UpIcon, UpIconSolid} from '../../lib/icons'
import {s, colors} from '../../lib/styles'

interface PostCtrlsOpts {
  replyCount: number
  repostCount: number
  upvoteCount: number
  isReposted: boolean
  isUpvoted: boolean
  onPressReply: () => void
  onPressToggleRepost: () => void
  onPressToggleUpvote: () => void
}

export function PostCtrls(opts: PostCtrlsOpts) {
  const interp1 = useSharedValue<number>(0)
  const interp2 = useSharedValue<number>(0)

  const anim1Style = useAnimatedStyle(() => ({
    transform: [{scale: interpolate(interp1.value, [0, 1.0], [1.0, 3.0])}],
    opacity: interpolate(interp1.value, [0, 1.0], [1.0, 0.0]),
  }))
  const anim2Style = useAnimatedStyle(() => ({
    transform: [{scale: interpolate(interp2.value, [0, 1.0], [1.0, 3.0])}],
    opacity: interpolate(interp2.value, [0, 1.0], [1.0, 0.0]),
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

  return (
    <View style={styles.ctrls}>
      <View style={s.flex1}>
        <TouchableOpacity style={styles.ctrl} onPress={opts.onPressReply}>
          <FontAwesomeIcon
            style={styles.ctrlIcon}
            icon={['far', 'comment']}
            size={14}
          />
          <Text style={[s.gray5, s.ml5, s.f13]}>{opts.replyCount}</Text>
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
                : [s.gray5, s.f13, s.ml5]
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
              opts.isUpvoted
                ? [s.bold, s.red3, s.f13, s.ml5]
                : [s.gray5, s.f13, s.ml5]
            }>
            {opts.upvoteCount}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={s.flex1}></View>
    </View>
  )
}

const styles = StyleSheet.create({
  ctrls: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  ctrl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  ctrlIcon: {
    color: colors.gray4,
  },
  ctrlIconReposted: {
    color: colors.green3,
  },
  ctrlIconUpvoted: {
    color: colors.red3,
  },
})
