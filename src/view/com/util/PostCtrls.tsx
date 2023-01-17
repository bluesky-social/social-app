import React from 'react'
import {
  Animated,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import {Text} from './text/Text'
import {PostDropdownBtn} from './forms/DropdownButton'
import {UpIcon, UpIconSolid, CommentBottomArrow} from '../../lib/icons'
import {s, colors} from '../../lib/styles'
import {useTheme} from '../../lib/ThemeContext'
import {useAnimatedValue} from '../../lib/hooks/useAnimatedValue'

interface PostCtrlsOpts {
  itemHref: string
  itemTitle: string
  isAuthor: boolean
  big?: boolean
  style?: StyleProp<ViewStyle>
  replyCount?: number
  repostCount?: number
  upvoteCount?: number
  isReposted: boolean
  isUpvoted: boolean
  onPressReply: () => void
  onPressToggleRepost: () => void
  onPressToggleUpvote: () => void
  onCopyPostText: () => void
  onDeletePost: () => void
}

const redgray = '#7A6161'
const sRedgray = {color: redgray}
const HITSLOP = {top: 2, left: 2, bottom: 2, right: 2}

export function PostCtrls(opts: PostCtrlsOpts) {
  const theme = useTheme()
  const interp1 = useAnimatedValue(0)
  const interp2 = useAnimatedValue(0)

  const anim1Style = {
    transform: [
      {
        scale: interp1.interpolate({
          inputRange: [0, 1.0],
          outputRange: [1.0, 4.0],
        }),
      },
    ],
    opacity: interp1.interpolate({
      inputRange: [0, 1.0],
      outputRange: [1.0, 0.0],
    }),
  }
  const anim2Style = {
    transform: [
      {
        scale: interp2.interpolate({
          inputRange: [0, 1.0],
          outputRange: [1.0, 4.0],
        }),
      },
    ],
    opacity: interp2.interpolate({
      inputRange: [0, 1.0],
      outputRange: [1.0, 0.0],
    }),
  }

  const onPressToggleRepostWrapper = () => {
    if (!opts.isReposted) {
      ReactNativeHapticFeedback.trigger('impactMedium')
      Animated.sequence([
        Animated.timing(interp1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(interp1, {
          toValue: 0,
          duration: 20,
          useNativeDriver: true,
        }),
      ]).start()
    }
    opts.onPressToggleRepost()
  }
  const onPressToggleUpvoteWrapper = () => {
    if (!opts.isUpvoted) {
      ReactNativeHapticFeedback.trigger('impactMedium')
      Animated.sequence([
        Animated.timing(interp2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(interp2, {
          toValue: 0,
          duration: 20,
          useNativeDriver: true,
        }),
      ]).start()
    }
    opts.onPressToggleUpvote()
  }

  return (
    <View style={[styles.ctrls, opts.style]}>
      <View style={s.flex1}>
        <TouchableOpacity
          style={styles.ctrl}
          hitSlop={HITSLOP}
          onPress={opts.onPressReply}>
          <CommentBottomArrow
            style={styles.ctrlIcon}
            strokeWidth={3}
            size={opts.big ? 20 : 15}
          />
          {typeof opts.replyCount !== 'undefined' ? (
            <Text style={[sRedgray, s.ml5, s.f15]}>{opts.replyCount}</Text>
          ) : undefined}
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity
          hitSlop={HITSLOP}
          onPress={onPressToggleRepostWrapper}
          style={styles.ctrl}>
          <Animated.View style={anim1Style}>
            <FontAwesomeIcon
              style={
                opts.isReposted ? styles.ctrlIconReposted : styles.ctrlIcon
              }
              icon="retweet"
              size={opts.big ? 22 : 19}
            />
          </Animated.View>
          {typeof opts.repostCount !== 'undefined' ? (
            <Text
              style={
                opts.isReposted
                  ? [s.bold, s.green3, s.f15, s.ml5]
                  : [sRedgray, s.f15, s.ml5]
              }>
              {opts.repostCount}
            </Text>
          ) : undefined}
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity
          style={styles.ctrl}
          hitSlop={HITSLOP}
          onPress={onPressToggleUpvoteWrapper}>
          <Animated.View style={anim2Style}>
            {opts.isUpvoted ? (
              <UpIconSolid
                style={[styles.ctrlIconUpvoted]}
                size={opts.big ? 22 : 19}
              />
            ) : (
              <UpIcon
                style={[styles.ctrlIcon]}
                size={opts.big ? 22 : 19}
                strokeWidth={1.5}
              />
            )}
          </Animated.View>
          {typeof opts.upvoteCount !== 'undefined' ? (
            <Text
              style={
                opts.isUpvoted
                  ? [s.bold, s.red3, s.f15, s.ml5]
                  : [sRedgray, s.f15, s.ml5]
              }>
              {opts.upvoteCount}
            </Text>
          ) : undefined}
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        {opts.big ? undefined : (
          <PostDropdownBtn
            style={styles.ctrl}
            itemHref={opts.itemHref}
            itemTitle={opts.itemTitle}
            isAuthor={opts.isAuthor}
            onCopyPostText={opts.onCopyPostText}
            onDeletePost={opts.onDeletePost}>
            <FontAwesomeIcon
              icon="ellipsis-h"
              size={18}
              style={[
                s.mt2,
                s.mr5,
                {
                  color:
                    theme.colorScheme === 'light' ? colors.gray3 : colors.gray5,
                },
              ]}
            />
          </PostDropdownBtn>
        )}
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
  },
  ctrlIcon: {
    color: redgray,
  },
  ctrlIconReposted: {
    color: colors.green3,
  },
  ctrlIconUpvoted: {
    color: colors.red3,
  },
})
