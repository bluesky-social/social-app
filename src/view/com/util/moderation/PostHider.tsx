import React, {ComponentProps} from 'react'
import {StyleSheet, Pressable, View, ViewStyle, StyleProp} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {addStyle} from 'lib/styles'
import {ShieldExclamation} from 'lib/icons'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'

import {ModerationDetailsDialog} from '#/components/dialogs/ModerationDetails'
import {useOpenGlobalDialog} from '#/components/dialogs'

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
  const pal = usePalette('default')
  const {_} = useLingui()
  const [override, setOverride] = React.useState(false)
  const openDialog = useOpenGlobalDialog()
  const blur = modui.blurs[0]
  const desc = useModerationCauseDescription(blur, 'content')

  if (!blur) {
    return (
      <Link
        testID={testID}
        style={style}
        href={href}
        noFeedback
        accessible={false}
        {...props}>
        {children}
      </Link>
    )
  }

  const isMute = blur.type === 'muted'
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
        styles.description,
        override ? {paddingBottom: 0} : undefined,
        pal.view,
      ]}>
      <Pressable
        onPress={() => {
          openDialog(ModerationDetailsDialog, {
            context: 'content',
            modcause: blur,
          })
        }}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Learn more about this warning`)}
        accessibilityHint="">
        <View
          style={[
            pal.viewLight,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize,
              alignItems: 'center',
              justifyContent: 'center',
            },
            iconStyles,
          ]}>
          {isMute ? (
            <FontAwesomeIcon
              icon={['far', 'eye-slash']}
              size={14}
              color={pal.colors.textLight}
            />
          ) : (
            <ShieldExclamation size={14} style={pal.textLight} />
          )}
        </View>
      </Pressable>
      <Text type="sm" style={[{flex: 1}, pal.textLight]} numberOfLines={1}>
        {desc.name}
      </Text>
      {!modui.noOverride && (
        <Text type="sm" style={[styles.showBtn, pal.link]}>
          {override ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
        </Text>
      )}
    </Pressable>
  ) : (
    <Link
      testID={testID}
      style={addStyle(style, styles.child)}
      href={href}
      noFeedback>
      {children}
    </Link>
  )
}

const styles = StyleSheet.create({
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingLeft: 6,
    paddingRight: 18,
    marginTop: 1,
  },
  showBtn: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  child: {
    borderWidth: 0,
    borderTopWidth: 0,
    borderRadius: 8,
  },
})
