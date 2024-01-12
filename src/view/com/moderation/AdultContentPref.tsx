import React from 'react'
import {StyleSheet, View} from 'react-native'
import {s} from 'lib/styles'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {ToggleButton} from '../util/forms/ToggleButton'
import {Button} from '../util/forms/Button'
import {usePalette} from 'lib/hooks/usePalette'
import {isIOS} from 'platform/detection'
import * as Toast from '../util/Toast'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {
  usePreferencesQuery,
  usePreferencesSetAdultContentMutation,
} from '#/state/queries/preferences'

export function AdultContentEnabledPref() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetAdultContentMutation()
  const {openModal} = useModalControls()

  const onSetAge = React.useCallback(
    () => openModal({name: 'birth-date-settings'}),
    [openModal],
  )

  const onToggleAdultContent = React.useCallback(async () => {
    if (isIOS) return

    try {
      mutate({
        enabled: !(variables?.enabled ?? preferences?.adultContentEnabled),
      })
    } catch (e) {
      Toast.show(
        _(msg`There was an issue syncing your preferences with the server`),
      )
      logger.error('Failed to update preferences with server', {error: e})
    }
  }, [variables, preferences, mutate, _])

  return (
    <View style={[pal.border, {borderTopWidth: 1, paddingHorizontal: 12}]}>
      {isIOS ? (
        preferences?.adultContentEnabled ? null : (
          <View style={{paddingVertical: 12}}>
            <Text type="md" style={pal.textLight}>
              <Trans>
                Adult content can only be enabled via the Web at{' '}
                <TextLink
                  style={pal.link}
                  href="https://bsky.app"
                  text="bsky.app"
                />
                .
              </Trans>
            </Text>
          </View>
        )
      ) : (preferences?.userAge || 0) >= 18 ? (
        <View style={{paddingVertical: 4}}>
          <ToggleButton
            type="default-light"
            label={_(msg`Enable Adult Content`)}
            isSelected={
              variables?.enabled ?? preferences?.adultContentEnabled ?? false
            }
            onPress={onToggleAdultContent}
            style={styles.toggleBtn}
          />
        </View>
      ) : (
        <View style={styles.agePrompt}>
          <Text type="md" style={[pal.text, {flex: 1}]}>
            <Trans>You must be 18 or older to enable adult content.</Trans>
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  agePrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleBtn: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
})
