import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lodash'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

const HITSLOP = {left: 20, top: 20, right: 20, bottom: 20}

export const LoadLatestBtn = observer(
  ({onPress, label}: {onPress: () => void; label: string}) => {
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
})
