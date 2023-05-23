import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {observer} from 'mobx-react-lite'
import LinearGradient from 'react-native-linear-gradient'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Text} from '../text/Text'
import {colors, gradients} from 'lib/styles'
import {clamp} from 'lodash'
import {useStores} from 'state/index'

const HITSLOP = {left: 20, top: 20, right: 20, bottom: 20}

export const LoadLatestBtn = observer(
  ({onPress, label}: {onPress: () => void; label: string}) => {
    const store = useStores()
    const safeAreaInsets = useSafeAreaInsets()
    return (
      <TouchableOpacity
        style={[
          styles.loadLatest,
          !store.shell.minimalShellMode && {
            bottom: 60 + clamp(safeAreaInsets.bottom, 15, 30),
          },
        ]}
        onPress={onPress}
        hitSlop={HITSLOP}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={label}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.loadLatestInner}>
          <Text type="md-bold" style={styles.loadLatestText}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  },
)

const styles = StyleSheet.create({
  loadLatest: {
    position: 'absolute',
    left: 20,
    bottom: 35,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
  },
  loadLatestInner: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
  },
  loadLatestText: {
    color: colors.white,
  },
})
