import React from 'react'
import {Pressable, StyleProp, View, ViewStyle} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useRequireAuth} from '#/state/session'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {OpenQuote_Stroke2_Corner0_Rounded as Quote} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner0_Rounded as Repost} from '#/components/icons/Repost'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {EventStopper} from '../EventStopper'

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
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const requireAuth = useRequireAuth()

  const color = React.useMemo(
    () => ({
      color: isReposted ? t.palette.positive_600 : t.palette.contrast_500,
    }),
    [t, isReposted],
  )

  return hasSession ? (
    <EventStopper>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Repost or quote post`)}>
          {({props, state}) => {
            return (
              <Pressable
                {...props}
                style={[
                  a.rounded_full,
                  (state.hovered || state.pressed) && {
                    backgroundColor: t.palette.positive_100,
                  },
                ]}>
                <RepostInner
                  big={big}
                  isReposted={isReposted}
                  color={
                    state.hovered || state.pressed
                      ? {color: t.palette.positive_600}
                      : color
                  }
                  repostCount={repostCount}
                />
              </Pressable>
            )
          }}
        </Menu.Trigger>
        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Item
            label={isReposted ? _(msg`Undo repost`) : _(msg`Repost`)}
            testID="repostDropdownRepostBtn"
            onPress={onRepost}>
            <Menu.ItemText>
              {isReposted ? _(msg`Undo repost`) : _(msg`Repost`)}
            </Menu.ItemText>
            <Menu.ItemIcon icon={Repost} position="right" />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Quote post`)}
            testID="repostDropdownQuoteBtn"
            onPress={onQuote}>
            <Menu.ItemText>{_(msg`Quote post`)}</Menu.ItemText>
            <Menu.ItemIcon icon={Quote} position="right" />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        requireAuth(() => {})
      }}
      accessibilityLabel={_(msg`Repost or quote post`)}
      accessibilityHint="">
      <RepostInner
        big={big}
        isReposted={isReposted}
        color={color}
        repostCount={repostCount}
      />
    </Pressable>
  )
}

const RepostInner = ({
  big,
  isReposted,
  color,
  repostCount,
}: {
  big?: boolean
  isReposted: boolean
  color: {color: string}
  repostCount?: number
}) => (
  <View style={[a.flex_row, a.align_center, a.gap_xs, {padding: 5}]}>
    <Repost size={big ? 'lg' : 'md'} style={color} />
    {typeof repostCount !== 'undefined' && repostCount > 0 ? (
      <Text
        testID="repostCount"
        style={[color, a.text_md, isReposted && [a.font_bold]]}>
        {repostCount}
      </Text>
    ) : undefined}
  </View>
)
