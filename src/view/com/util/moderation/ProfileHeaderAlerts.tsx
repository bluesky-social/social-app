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
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useModalControls} from '#/state/modals'

export function ProfileHeaderAlerts({
  moderation,
  style,
}: {
  moderation: ProfileModeration
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openModal} = useModalControls()

  const causes = getProfileModerationCauses(moderation)
  if (!causes.length) {
    return null
  }

  return (
    <View style={styles.grid}>
      {causes.map(cause => {
        const isMute = cause.type === 'muted'
        const desc = describeModerationCause(cause, 'account')
        return (
          <Pressable
            testID="profileHeaderAlert"
            key={desc.name}
            onPress={() => {
              openModal({
                name: 'moderation-details',
                context: 'content',
                moderation: {cause},
              })
            }}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Learn more about this warning`)}
            accessibilityHint=""
            style={[styles.container, pal.viewLight, style]}>
            {isMute ? (
              <FontAwesomeIcon
                icon={['far', 'eye-slash']}
                size={14}
                color={pal.colors.textLight}
              />
            ) : (
              <ShieldExclamation style={pal.text} size={18} />
            )}
            <Text type="sm" style={[{flex: 1}, pal.text]}>
              {desc.name}
            </Text>
            <Text type="sm" style={[pal.link, styles.learnMoreBtn]}>
              <Trans>Learn More</Trans>
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
