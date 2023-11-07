import React from 'react'
import {Pressable, StyleProp, StyleSheet, ViewStyle} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ShieldExclamation} from 'lib/icons'
import {describeModerationCause} from 'lib/moderation'
import {useModalControls} from '#/state/modals'

export function PostAlerts({
  moderation,
  style,
}: {
  moderation: ModerationUI
  includeMute?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const {openModal} = useModalControls()

  const shouldAlert = !!moderation.cause && moderation.alert
  if (!shouldAlert) {
    return null
  }

  const desc = describeModerationCause(moderation.cause, 'content')
  return (
    <Pressable
      onPress={() => {
        openModal({
          name: 'moderation-details',
          context: 'content',
          moderation,
        })
      }}
      accessibilityRole="button"
      accessibilityLabel="Learn more about this warning"
      accessibilityHint=""
      style={[styles.container, pal.viewLight, style]}>
      <ShieldExclamation style={pal.text} size={16} />
      <Text type="lg" style={[pal.text]}>
        {desc.name}{' '}
        <Text type="lg" style={[pal.link, styles.learnMoreBtn]}>
          Learn More
        </Text>
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  learnMoreBtn: {
    marginLeft: 'auto',
  },
})
