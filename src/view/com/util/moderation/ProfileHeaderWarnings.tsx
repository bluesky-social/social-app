import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'

export function ProfileHeaderWarnings({
  moderation,
}: {
  moderation: ModerationUI
}) {
  const palErr = usePalette('error')
  if (!moderation.cause) {
    return null
  }
  return (
    <View style={[styles.container, palErr.border, palErr.view]}>
      <FontAwesomeIcon
        icon="circle-exclamation"
        style={palErr.text as FontAwesomeIconStyle}
        size={20}
      />
      <Text style={palErr.text}>
        This account has been flagged: {'' /* TODO moderation.reason*/}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
})
