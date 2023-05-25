import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lodash'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {colors} from 'lib/styles'

const HITSLOP = {left: 20, top: 20, right: 20, bottom: 20}

export const LoadLatestBtn = observer(
  ({
    onPress,
    label,
    showIndicator,
  }: {
    onPress: () => void
    label: string
    showIndicator: boolean
    minimalShellMode?: boolean // NOTE not used on mobile -prf
  }) => {
    const store = useStores()
    const pal = usePalette('default')
    const safeAreaInsets = useSafeAreaInsets()
    return (
      <TouchableOpacity
        style={[
          styles.loadLatest,
          pal.borderDark,
          pal.view,
          !store.shell.minimalShellMode && {
            bottom: 60 + clamp(safeAreaInsets.bottom, 15, 30),
          },
        ]}
        onPress={onPress}
        hitSlop={HITSLOP}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="">
        <FontAwesomeIcon icon="angle-up" color={pal.colors.text} size={19} />
        {showIndicator && <View style={[styles.indicator, pal.borderDark]} />}
      </TouchableOpacity>
    )
  },
)

const styles = StyleSheet.create({
  loadLatest: {
    position: 'absolute',
    left: 18,
    bottom: 35,
    borderWidth: 1,
    width: 52,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: colors.blue3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
})
