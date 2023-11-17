import React from 'react'
import {TouchableOpacity, StyleSheet} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {HITSLOP_10} from 'lib/constants'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useModalControls} from '#/state/modals'
import {ThreadgateSetting} from '#/state/queries/threadgate'

export function ThreadgateBtn({
  threadgate,
  onChange,
}: {
  threadgate: ThreadgateSetting[]
  onChange: (v: ThreadgateSetting[]) => void
}) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {openModal} = useModalControls()

  const onPress = () => {
    track('Composer:ThreadgateOpened')
    openModal({
      name: 'threadgate',
      settings: threadgate,
      onChange,
    })
  }

  return (
    <TouchableOpacity
      testID="openReplyGateButton"
      onPress={onPress}
      style={styles.button}
      hitSlop={HITSLOP_10}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Who can reply`)}
      accessibilityHint="">
      <FontAwesomeIcon
        icon="users"
        style={pal.link as FontAwesomeIconStyle}
        size={24}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
  },
})
