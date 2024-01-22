import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {ModerationUI, PostModeration} from '@atproto/api'
import {Text} from '../text/Text'
import {ShieldExclamation} from 'lib/icons'
import {describeModerationCause} from 'lib/moderation'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import {useModalControls} from '#/state/modals'
import {isPostMediaBlurred} from 'lib/moderation'

export function ContentHider({
  testID,
  moderation,
  moderationDecisions,
  ignoreMute,
  ignoreQuoteDecisions,
  style,
  childContainerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  moderation: ModerationUI
  moderationDecisions?: PostModeration['decisions']
  ignoreMute?: boolean
  ignoreQuoteDecisions?: boolean
  style?: StyleProp<ViewStyle>
  childContainerStyle?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const [override, setOverride] = React.useState(false)
  const {openModal} = useModalControls()

  if (
    !moderation.blur ||
    (ignoreMute && moderation.cause?.type === 'muted') ||
    shouldIgnoreQuote(moderationDecisions, ignoreQuoteDecisions)
  ) {
    return (
      <View testID={testID} style={[styles.outer, style]}>
        {children}
      </View>
    )
  }

  const isMute = moderation.cause?.type === 'muted'
  const desc = describeModerationCause(moderation.cause, 'content')
  return (
    <View testID={testID} style={[styles.outer, style]}>
      <Pressable
        onPress={() => {
          if (!moderation.noOverride) {
            setOverride(v => !v)
          } else {
            openModal({
              name: 'moderation-details',
              context: 'content',
              moderation,
            })
          }
        }}
        accessibilityRole="button"
        accessibilityHint={
          override ? _(msg`Hide the content`) : _(msg`Show the content`)
        }
        accessibilityLabel=""
        style={[
          styles.cover,
          moderation.noOverride
            ? {borderWidth: 1, borderColor: pal.colors.borderDark}
            : pal.viewLight,
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
          {isMute ? (
            <FontAwesomeIcon
              icon={['far', 'eye-slash']}
              size={18}
              color={pal.colors.textLight}
            />
          ) : (
            <ShieldExclamation size={18} style={pal.textLight} />
          )}
        </Pressable>
        <Text type="md" style={[pal.text, {flex: 1}]} numberOfLines={2}>
          {desc.name}
        </Text>
        <View style={styles.showBtn}>
          <Text type="lg" style={pal.link}>
            {moderation.noOverride ? (
              <Trans>Learn more</Trans>
            ) : override ? (
              <Trans>Hide</Trans>
            ) : (
              <Trans>Show</Trans>
            )}
          </Text>
        </View>
      </Pressable>
      {override && <View style={childContainerStyle}>{children}</View>}
    </View>
  )
}

function shouldIgnoreQuote(
  decisions: PostModeration['decisions'] | undefined,
  ignore: boolean | undefined,
): boolean {
  if (!decisions || !ignore) {
    return false
  }
  return !isPostMediaBlurred(decisions)
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  cover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
  },
  showBtn: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
})
