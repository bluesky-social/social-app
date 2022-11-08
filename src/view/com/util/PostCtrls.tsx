import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
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
  return (
    <View style={styles.ctrls}>
      <TouchableOpacity style={styles.ctrl} onPress={opts.onPressReply}>
        <FontAwesomeIcon
          style={styles.ctrlIcon}
          icon={['far', 'comment']}
          size={14}
        />
        <Text style={s.f13}>{opts.replyCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ctrl} onPress={opts.onPressToggleRepost}>
        <FontAwesomeIcon
          style={opts.isReposted ? styles.ctrlIconReposted : styles.ctrlIcon}
          icon="retweet"
          size={18}
        />
        <Text style={opts.isReposted ? [s.bold, s.green3, s.f13] : s.f13}>
          {opts.repostCount}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ctrl} onPress={opts.onPressToggleUpvote}>
        {opts.isUpvoted ? (
          <UpIconSolid style={styles.ctrlIconUpvoted} size={18} />
        ) : (
          <UpIcon style={styles.ctrlIcon} size={18} />
        )}
        <Text style={opts.isUpvoted ? [s.bold, s.red3, s.f13] : s.f13}>
          {opts.upvoteCount}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ctrl}
        onPress={opts.onPressToggleDownvote}>
        {opts.isDownvoted ? (
          <DownIconSolid style={styles.ctrlIconDownvoted} size={18} />
        ) : (
          <DownIcon style={styles.ctrlIcon} size={18} />
        )}
        <Text style={opts.isDownvoted ? [s.bold, s.blue3, s.f13] : s.f13}>
          {opts.downvoteCount}
        </Text>
      </TouchableOpacity>
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
    flex: 1,
    paddingLeft: 4,
    paddingRight: 4,
  },
  ctrlIcon: {
    marginRight: 5,
    color: colors.gray5,
  },
  ctrlIconReposted: {
    marginRight: 5,
    color: colors.green3,
  },
  ctrlIconUpvoted: {
    marginRight: 5,
    color: colors.red3,
  },
  ctrlIconDownvoted: {
    marginRight: 5,
    color: colors.blue3,
  },
})
