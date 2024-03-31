import React, {ComponentProps} from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {addStyle} from 'lib/styles'
// import {Link} from '#/components/Link' TODO this imposes some styles that screw things up
import {Link} from '#/view/com/util/Link'
import {atoms as a, useTheme} from '#/alf'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

interface Props extends ComponentProps<typeof Link> {
  iconSize: number
  iconStyles: StyleProp<ViewStyle>
  modui: ModerationUI
}

export function PostHider({
  testID,
  href,
  modui,
  style,
  children,
  iconSize,
  iconStyles,
  ...props
}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const [override, setOverride] = React.useState(false)
  const control = useModerationDetailsDialogControl()
  const blur = modui.blurs[0]
  const desc = useModerationCauseDescription(blur)

  if (!blur) {
    return (
      <Link
        testID={testID}
        style={style}
        href={href}
        accessible={false}
        {...props}>
        {children}
      </Link>
    )
  }

  return !override ? (
    <Pressable
      onPress={() => {
        if (!modui.noOverride) {
          setOverride(v => !v)
        }
      }}
      accessibilityRole="button"
      accessibilityHint={
        override ? _(msg`Hide the content`) : _(msg`Show the content`)
      }
      accessibilityLabel=""
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.py_md,
        {
          paddingLeft: 6,
          paddingRight: 18,
        },
        override ? {paddingBottom: 0} : undefined,
        t.atoms.bg,
      ]}>
      <ModerationDetailsDialog control={control} modcause={blur} />
      <Pressable
        onPress={() => {
          control.open()
        }}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Learn more about this warning`)}
        accessibilityHint="">
        <View
          style={[
            t.atoms.bg_contrast_25,
            a.align_center,
            a.justify_center,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize,
            },
            iconStyles,
          ]}>
          <desc.icon size="sm" fill={t.atoms.text_contrast_medium.color} />
        </View>
      </Pressable>
      <Text style={[t.atoms.text_contrast_medium, a.flex_1]} numberOfLines={1}>
        {desc.name}
      </Text>
      {!modui.noOverride && (
        <Text style={[{color: t.palette.primary_500}]}>
          {override ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
        </Text>
      )}
    </Pressable>
  ) : (
    <Link
      testID={testID}
      style={addStyle(style, styles.child)}
      href={href}
      accessible={false}
      {...props}>
      {children}
    </Link>
  )
}

const styles = StyleSheet.create({
  child: {
    borderWidth: 0,
    borderTopWidth: 0,
    borderRadius: 8,
  },
})
