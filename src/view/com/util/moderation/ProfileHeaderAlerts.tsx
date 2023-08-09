import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {ProfileModeration} from '@atproto/api'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ShieldExclamation} from 'lib/icons'
import {
  describeModerationCause,
  getProfileModerationCauses,
} from 'lib/moderation'
import {useStores} from 'state/index'

export function ProfileHeaderAlerts({
  moderation,
  style,
}: {
  moderation: ProfileModeration
  style?: StyleProp<ViewStyle>
}) {
  const store = useStores()
  const pal = usePalette('default')

  const causes = getProfileModerationCauses(moderation)
  if (!causes.length) {
    return null
  }

  return (
    <View style={styles.grid}>
      {causes.map(cause => {
        const desc = describeModerationCause(cause, 'account')
        return (
          <Pressable
            testID="profileHeaderAlert"
            key={desc.name}
            onPress={() => {
              store.shell.openModal({
                name: 'moderation-details',
                context: 'content',
                moderation: {cause},
              })
            }}
            accessibilityRole="button"
            accessibilityLabel="Learn more about this warning"
            accessibilityHint=""
            style={[styles.container, pal.viewLight, style]}>
            <ShieldExclamation style={pal.text} size={24} />
            <Text type="lg" style={pal.text}>
              {desc.name}
            </Text>
            <Text type="lg" style={[pal.link, styles.learnMoreBtn]}>
              Learn More
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    gap: 4,
  },
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
