import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {InfoCircleIcon} from 'lib/icons'
import {describeModerationCause} from 'lib/strings/moderation'
import {useStores} from 'state/index'

export function ProfileHeaderAlerts({
  moderation,
  style,
}: {
  moderation: ModerationUI
  style?: StyleProp<ViewStyle>
}) {
  const store = useStores()
  const pal = usePalette('default')

  if (!moderation.cause) {
    //} || !moderation.alert) {
    return null
  }

  const desc = describeModerationCause(moderation.cause, 'account')
  return (
    <View style={[styles.container, pal.viewLight, style]}>
      <InfoCircleIcon style={pal.text} size={24} />
      <Text type="lg" style={pal.text}>
        {desc.name} Warning
      </Text>
      <Pressable
        onPress={() => {
          store.shell.openModal({
            name: 'moderation-details',
            context: 'content',
            moderation,
          })
        }}
        accessibilityRole="button"
        accessibilityLabel="Learn more about this warning"
        accessibilityHint=""
        style={styles.learnMoreBtn}>
        <Text type="lg" style={pal.link}>
          Learn More
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  learnMoreBtn: {
    marginLeft: 'auto',
  },
})
