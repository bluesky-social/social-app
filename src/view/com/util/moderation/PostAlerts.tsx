import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'

export function PostAlerts({
  moderation,
  style,
}: {
  moderation: ModerationUI
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const palError = usePalette('error')
  if (!moderation.cause || !moderation.alert) {
    return null
  }
  return (
    <View style={[styles.container, pal.viewLight, style]}>
      <FontAwesomeIcon
        icon="circle-exclamation"
        color={palError.colors.background}
        size={16}
      />
      <Text style={pal.text}>
        This post has been flagged: {'' /* TODO moderation.reason*/}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
})
