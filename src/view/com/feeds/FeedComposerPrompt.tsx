import React, {useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export function FeedComposerPrompt() {
  const {_} = useLingui()
  const t = useTheme()
  const {openComposer} = useOpenComposer()
  const profile = useCurrentAccountProfile()
  const [hover, setHover] = useState(false)

  const onPress = React.useCallback(() => {
    logger.metric('postComposer:click', {})
    openComposer({})
  }, [openComposer])

  if (!profile) {
    return null
  }

  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
  )
  const handle = sanitizeHandle(profile.handle, '@')

  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Compose new post`)}
      accessibilityHint={_(msg`Opens the post composer`)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={({pressed}) => [
        a.relative,
        a.flex_row,
        a.align_start,
        {
          paddingLeft: 18,
          paddingRight: 15,
        },
        a.py_md,
        native({
          paddingTop: 15,
          paddingBottom: 15,
        }),
        {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: t.atoms.border_contrast_low.borderColor,
        },
        web({
          cursor: 'pointer',
          outline: 'none',
        }),
        pressed && web({outline: 'none'}),
      ]}>
      <SubtleHover hover={hover} />
      <UserAvatar
        avatar={profile.avatar}
        size={40}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
      />
      <View style={[a.flex_1, a.ml_md]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.mb_sm]}>
          <Text
            emoji
            style={[a.text_md, a.font_semi_bold, a.flex_shrink]}
            numberOfLines={1}>
            {displayName}
          </Text>
          <Text
            style={[a.text_md, t.atoms.text_contrast_medium, a.flex_shrink]}
            numberOfLines={1}>
            {handle}
          </Text>
        </View>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.px_md,
            {
              height: 40,
              borderRadius: 20,
            },
            t.atoms.bg_contrast_50,
          ]}>
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.text_md,
              {
                lineHeight: a.text_md.fontSize,
                includeFontPadding: false,
              },
            ]}>
            {_(msg`What's up?`)}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}
