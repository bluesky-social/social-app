import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
// DISABLED see #135
// import {
//   TriggerableAnimated,
//   TriggerableAnimatedRef,
// } from './anim/TriggerableAnimated'
import {Text} from './text/Text'
import {PostDropdownBtn} from './forms/DropdownButton'
import {
  HeartIcon,
  HeartIconSolid,
  RepostIcon,
  CommentBottomArrow,
} from 'lib/icons'
import {s, colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'

interface PostCtrlsOpts {
  itemUri: string
  itemCid: string
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
  onPressToggleRepost: () => Promise<void>
  onPressToggleUpvote: () => Promise<void>
  onCopyPostText: () => void
  onDeletePost: () => void
}

const HITSLOP = {top: 5, left: 5, bottom: 5, right: 5}

// DISABLED see #135
/*
function ctrlAnimStart(interp: Animated.Value) {
  return Animated.sequence([
    Animated.timing(interp, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.delay(50),
    Animated.timing(interp, {
      toValue: 0,
      duration: 20,
      useNativeDriver: true,
    }),
  ])
}

function ctrlAnimStyle(interp: Animated.Value) {
  return {
    transform: [
      {
        scale: interp.interpolate({
          inputRange: [0, 1.0],
          outputRange: [1.0, 4.0],
        }),
      },
    ],
    opacity: interp.interpolate({
      inputRange: [0, 1.0],
      outputRange: [1.0, 0.0],
    }),
  }
}
*/

export function PostCtrls(opts: PostCtrlsOpts) {
  const theme = useTheme()
  const defaultCtrlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  ) as StyleProp<ViewStyle>
  const [repostMod, setRepostMod] = React.useState<number>(0)
  const [likeMod, setLikeMod] = React.useState<number>(0)
  // DISABLED see #135
  // const repostRef = React.useRef<TriggerableAnimatedRef | null>(null)
  // const likeRef = React.useRef<TriggerableAnimatedRef | null>(null)
  const onPressToggleRepostWrapper = () => {
    if (!opts.isReposted) {
      ReactNativeHapticFeedback.trigger('impactMedium')
      setRepostMod(1)
      opts
        .onPressToggleRepost()
        .catch(_e => undefined)
        .then(() => setRepostMod(0))
      // DISABLED see #135
      // repostRef.current?.trigger(
      //   {start: ctrlAnimStart, style: ctrlAnimStyle},
      //   async () => {
      //     await opts.onPressToggleRepost().catch(_e => undefined)
      //     setRepostMod(0)
      //   },
      // )
    } else {
      setRepostMod(-1)
      opts
        .onPressToggleRepost()
        .catch(_e => undefined)
        .then(() => setRepostMod(0))
    }
  }
  const onPressToggleUpvoteWrapper = () => {
    if (!opts.isUpvoted) {
      ReactNativeHapticFeedback.trigger('impactMedium')
      setLikeMod(1)
      opts
        .onPressToggleUpvote()
        .catch(_e => undefined)
        .then(() => setLikeMod(0))
      // DISABLED see #135
      // likeRef.current?.trigger(
      //   {start: ctrlAnimStart, style: ctrlAnimStyle},
      //   async () => {
      //     await opts.onPressToggleUpvote().catch(_e => undefined)
      //     setLikeMod(0)
      //   },
      // )
    } else {
      setLikeMod(-1)
      opts
        .onPressToggleUpvote()
        .catch(_e => undefined)
        .then(() => setLikeMod(0))
    }
  }

  return (
    <View style={[styles.ctrls, opts.style]}>
      <View style={s.flex1}>
        <TouchableOpacity
          style={styles.ctrl}
          hitSlop={HITSLOP}
          onPress={opts.onPressReply}>
          <CommentBottomArrow
            style={[defaultCtrlColor, opts.big ? s.mt2 : styles.mt1]}
            strokeWidth={3}
            size={opts.big ? 20 : 15}
          />
          {typeof opts.replyCount !== 'undefined' ? (
            <Text style={[defaultCtrlColor, s.ml5, s.f15]}>
              {opts.replyCount}
            </Text>
          ) : undefined}
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity
          hitSlop={HITSLOP}
          onPress={onPressToggleRepostWrapper}
          style={styles.ctrl}>
          <RepostIcon
            style={
              opts.isReposted || repostMod > 0
                ? (styles.ctrlIconReposted as StyleProp<ViewStyle>)
                : defaultCtrlColor
            }
            strokeWidth={2.4}
            size={opts.big ? 24 : 20}
          />
          {
            undefined /*DISABLED see #135 <TriggerableAnimated ref={repostRef}>
            <RepostIcon
              style={
                (opts.isReposted
                  ? styles.ctrlIconReposted
                  : defaultCtrlColor) as ViewStyle
              }
              strokeWidth={2.4}
              size={opts.big ? 24 : 20}
            />
            </TriggerableAnimated>*/
          }
          {typeof opts.repostCount !== 'undefined' ? (
            <Text
              style={
                opts.isReposted || repostMod > 0
                  ? [s.bold, s.green3, s.f15, s.ml5]
                  : [defaultCtrlColor, s.f15, s.ml5]
              }>
              {opts.repostCount + repostMod}
            </Text>
          ) : undefined}
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity
          style={styles.ctrl}
          hitSlop={HITSLOP}
          onPress={onPressToggleUpvoteWrapper}>
          {opts.isUpvoted || likeMod > 0 ? (
            <HeartIconSolid
              style={styles.ctrlIconUpvoted as StyleProp<ViewStyle>}
              size={opts.big ? 22 : 16}
            />
          ) : (
            <HeartIcon
              style={[defaultCtrlColor, opts.big ? styles.mt1 : undefined]}
              strokeWidth={3}
              size={opts.big ? 20 : 16}
            />
          )}
          {
            undefined /*DISABLED see #135 <TriggerableAnimated ref={likeRef}>
            {opts.isUpvoted || likeMod > 0 ? (
              <HeartIconSolid
                style={styles.ctrlIconUpvoted as ViewStyle}
                size={opts.big ? 22 : 16}
              />
            ) : (
              <HeartIcon
                style={[
                  defaultCtrlColor as ViewStyle,
                  opts.big ? styles.mt1 : undefined,
                ]}
                strokeWidth={3}
                size={opts.big ? 20 : 16}
              />
            )}
            </TriggerableAnimated>*/
          }
          {typeof opts.upvoteCount !== 'undefined' ? (
            <Text
              style={
                opts.isUpvoted || likeMod > 0
                  ? [s.bold, s.red3, s.f15, s.ml5]
                  : [defaultCtrlColor, s.f15, s.ml5]
              }>
              {opts.upvoteCount + likeMod}
            </Text>
          ) : undefined}
        </TouchableOpacity>
      </View>
      <View style={s.flex1}>
        {opts.big ? undefined : (
          <PostDropdownBtn
            style={styles.ctrl}
            itemUri={opts.itemUri}
            itemCid={opts.itemCid}
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
                    theme.colorScheme === 'light' ? colors.gray4 : colors.gray5,
                } as FontAwesomeIconStyle,
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
  ctrlIconReposted: {
    color: colors.green3,
  },
  ctrlIconUpvoted: {
    color: colors.red3,
  },
  mt1: {
    marginTop: 1,
  },
})
