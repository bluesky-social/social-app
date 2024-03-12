import React, {ComponentProps} from 'react'
import {StyleSheet, Pressable, View, ViewStyle, StyleProp} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {addStyle} from 'lib/styles'
import {describeModerationCause} from 'lib/moderation'
import {ShieldExclamation} from 'lib/icons'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'
import {useModalControls} from '#/state/modals'

interface Props extends ComponentProps<typeof Link> {
  iconSize: number
  iconStyles: StyleProp<ViewStyle>
  moderation: ModerationUI
}

export function PostHider({
  testID,
  href,
  moderation,
  style,
  children,
  iconSize,
  iconStyles,
  ...props
}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const [override, setOverride] = React.useState(false)
  const {openModal} = useModalControls()

  if (!moderation.blur) {
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

  const isMute = ['muted', 'muted-word'].includes(moderation.cause?.type || '')
  const desc = describeModerationCause(moderation.cause, 'content')
  return !override ? (
    <Pressable
      onPress={() => {
        if (!moderation.noOverride) {
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
          openModal({
            name: 'moderation-details',
            context: 'content',
            moderation,
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
      {!moderation.noOverride && (
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
