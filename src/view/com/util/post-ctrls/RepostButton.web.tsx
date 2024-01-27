import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle, Pressable} from 'react-native'
import {RepostIcon} from 'lib/icons'
import {colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {Text} from '../text/Text'

import {
  NativeDropdown,
  DropdownItem as NativeDropdownItem,
} from '../forms/NativeDropdown'
import {EventStopper} from '../EventStopper'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useRequireAuth} from '#/state/session'
import {useSession} from '#/state/session'

interface Props {
  isReposted: boolean
  repostCount?: number
  big?: boolean
  onRepost: () => void
  onQuote: () => void
  style?: StyleProp<ViewStyle>
}

export const RepostButton = ({
  isReposted,
  repostCount,
  big,
  onRepost,
  onQuote,
}: Props) => {
  const theme = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const requireAuth = useRequireAuth()

  const defaultControlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  )

  const dropdownItems: NativeDropdownItem[] = [
    {
      label: isReposted ? _(msg`Undo repost`) : _(msg`Repost`),
      testID: 'repostDropdownRepostBtn',
      icon: {
        ios: {name: 'repeat'},
        android: '',
        web: 'retweet',
      },
      onPress: onRepost,
    },
    {
      label: _(msg`Quote post`),
      testID: 'repostDropdownQuoteBtn',
      icon: {
        ios: {name: 'quote.bubble'},
        android: '',
        web: 'quote-left',
      },
      onPress: onQuote,
    },
  ]

  const inner = (
    <View
      style={[
        styles.btn,
        !big && styles.btnPad,
        (isReposted
          ? styles.reposted
          : defaultControlColor) as StyleProp<ViewStyle>,
      ]}>
      <RepostIcon strokeWidth={2.2} size={big ? 24 : 20} />
      {typeof repostCount !== 'undefined' && repostCount > 0 ? (
        <Text
          testID="repostCount"
          type={isReposted ? 'md-bold' : 'md'}
          style={styles.repostCount}>
          {repostCount}
        </Text>
      ) : undefined}
    </View>
  )

  return hasSession ? (
    <EventStopper>
      <NativeDropdown
        items={dropdownItems}
        accessibilityLabel={_(msg`Repost or quote post`)}
        accessibilityHint="">
        {inner}
      </NativeDropdown>
    </EventStopper>
  ) : (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        requireAuth(() => {})
      }}
      accessibilityLabel={_(msg`Repost or quote post`)}
      accessibilityHint="">
      {inner}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
