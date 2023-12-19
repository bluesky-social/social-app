import React, {memo, useCallback} from 'react'
import {StyleProp, StyleSheet, TouchableOpacity, ViewStyle} from 'react-native'
import {RepostIcon} from 'lib/icons'
import {s, colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {pluralize} from 'lib/strings/helpers'
import {HITSLOP_10, HITSLOP_20} from 'lib/constants'
import {useModalControls} from '#/state/modals'
import {useRequireAuth} from '#/state/session'
import {Pressable, Text} from '#/alf'

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
    <Pressable
      row aic
      pa={!big ? 'xs' : 0}
      testID="repostBtn"
      onPress={() => {
        requireAuth(() => onPressToggleRepostWrapper())
      }}
      accessibilityRole="button"
      accessibilityLabel={`${
        isReposted ? 'Undo repost' : 'Repost'
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
      {typeof repostCount !== 'undefined' ? (
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
    </Pressable>
  )
}
RepostButton = memo(RepostButton)
export {RepostButton}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlPad: {
    padding: 5,
  },
  reposted: {
    color: colors.green3,
  },
  repostCount: {
    color: 'currentColor',
  },
})
