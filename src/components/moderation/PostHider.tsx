import React, {type ComponentProps} from 'react'
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import {
  type AppBskyActorDefs,
  type ModerationCause,
  type ModerationUI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {addStyle} from '#/lib/styles'
import {precacheProfile} from '#/state/queries/profile'
// import {Link} from '#/components/Link' TODO this imposes some styles that screw things up
import {Link} from '#/view/com/util/Link'
import {atoms as a, useTheme} from '#/alf'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

interface Props extends ComponentProps<typeof Link> {
  disabled: boolean
  iconSize: number
  iconStyles: StyleProp<ViewStyle>
  modui: ModerationUI
  profile: AppBskyActorDefs.ProfileViewBasic
  interpretFilterAsBlur?: boolean
}

export function PostHider({
  testID,
  href,
  disabled,
  modui,
  style,
  children,
  iconSize,
  iconStyles,
  profile,
  interpretFilterAsBlur,
  ...props
}: Props) {
  const queryClient = useQueryClient()
  const t = useTheme()
  const {_} = useLingui()
  const [override, setOverride] = React.useState(false)
  const control = useModerationDetailsDialogControl()
  const blur =
    modui.blurs[0] ||
    (interpretFilterAsBlur ? getBlurrableFilter(modui) : undefined)
  const desc = useModerationCauseDescription(blur)

  const onBeforePress = React.useCallback(() => {
    precacheProfile(queryClient, profile)
  }, [queryClient, profile])

  if (!blur || (disabled && !modui.noOverride)) {
    return (
      <Link
        testID={testID}
        style={style}
        href={href}
        accessible={false}
        onBeforePress={onBeforePress}
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
        override ? _(msg`Hides the content`) : _(msg`Shows the content`)
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
      <Text
        style={[t.atoms.text_contrast_medium, a.flex_1, a.leading_snug]}
        numberOfLines={1}>
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

function getBlurrableFilter(modui: ModerationUI): ModerationCause | undefined {
  // moderation causes get "downgraded" when they originate from embedded content
  // a downgraded cause should *only* drive filtering in feeds, so we want to look
  // for filters that arent downgraded
  return modui.filters.find(filter => !filter.downgraded)
}

const styles = StyleSheet.create({
  child: {
    borderWidth: 0,
    borderTopWidth: 0,
    borderRadius: 8,
  },
})
