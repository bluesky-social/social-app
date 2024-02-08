import React, {memo, useCallback} from 'react'
import {StyleProp, StyleSheet, TouchableOpacity, ViewStyle} from 'react-native'
import {RepostIcon} from 'lib/icons'
import {s, colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {Text} from '../text/Text'
import {pluralize} from 'lib/strings/helpers'
import {HITSLOP_10, HITSLOP_20} from 'lib/constants'
import {useModalControls} from '#/state/modals'
import {useRequireAuth} from '#/state/session'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

interface Props {
  isReposted: boolean
  repostCount?: number
  big?: boolean
  onRepost: () => void
  onQuote: () => void
}

let RepostButton = ({
  isReposted,
  repostCount,
  big,
  onRepost,
  onQuote,
}: Props): React.ReactNode => {
  const theme = useTheme()
  const {_} = useLingui()
  const {openModal} = useModalControls()
  const requireAuth = useRequireAuth()

  const defaultControlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  )

  const onPressToggleRepostWrapper = useCallback(() => {
    openModal({
      name: 'repost',
      onRepost: onRepost,
      onQuote: onQuote,
      isReposted,
    })
  }, [onRepost, onQuote, isReposted, openModal])

  return (
    <TouchableOpacity
      testID="repostBtn"
      onPress={() => {
        requireAuth(() => onPressToggleRepostWrapper())
      }}
      style={[styles.btn, !big && styles.btnPad]}
      accessibilityRole="button"
      accessibilityLabel={`${
        isReposted
          ? _(msg`Undo repost`)
          : _(msg({message: 'Repost', context: 'action'}))
      } (${repostCount} ${pluralize(repostCount || 0, 'repost')})`}
      accessibilityHint=""
      hitSlop={big ? HITSLOP_20 : HITSLOP_10}>
      <RepostIcon
        style={
          isReposted
            ? (styles.reposted as StyleProp<ViewStyle>)
            : defaultControlColor
        }
        strokeWidth={2.4}
        size={big ? 24 : 20}
      />
      {typeof repostCount !== 'undefined' && repostCount > 0 ? (
        <Text
          testID="repostCount"
          style={
            isReposted
              ? [s.bold, s.green3, s.f15, s.ml5]
              : [defaultControlColor, s.f15, s.ml5]
          }>
          {repostCount}
        </Text>
      ) : undefined}
    </TouchableOpacity>
  )
}
RepostButton = memo(RepostButton)
export {RepostButton}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnPad: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 5,
    paddingRight: 5,
  },
  reposted: {
    color: colors.green3,
  },
  repostCount: {
    color: 'currentColor',
  },
})
