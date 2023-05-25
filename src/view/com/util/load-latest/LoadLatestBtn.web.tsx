import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {LoadLatestBtn as LoadLatestBtnMobile} from './LoadLatestBtnMobile'
import {isMobileWeb} from 'platform/detection'
import {colors} from 'lib/styles'

const HITSLOP = {left: 20, top: 20, right: 20, bottom: 20}

export const LoadLatestBtn = ({
  onPress,
  label,
  showIndicator,
}: {
  onPress: () => void
  label: string
  showIndicator: boolean
}) => {
  const pal = usePalette('default')
  if (isMobileWeb) {
    return (
      <LoadLatestBtnMobile
        onPress={onPress}
        label={label}
        showIndicator={showIndicator}
      />
    )
  }
  return (
    <TouchableOpacity
      style={[pal.view, pal.borderDark, styles.loadLatest]}
      onPress={onPress}
      hitSlop={HITSLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="">
      <Text type="md-bold" style={pal.text}>
        <FontAwesomeIcon
          icon="angle-up"
          size={21}
          style={[pal.text, styles.icon]}
        />
      </Text>
      {showIndicator && <View style={styles.indicator} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  loadLatest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: '50vw',
    // @ts-ignore web only -prf
    transform: 'translateX(-282px)',
    bottom: 40,
    width: 54,
    height: 54,
    borderRadius: 30,
    borderWidth: 1,
  },
  icon: {
    position: 'relative',
    top: 2,
  },
  indicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: colors.blue3,
    width: 10,
    height: 10,
    borderRadius: 6,
  },
})
