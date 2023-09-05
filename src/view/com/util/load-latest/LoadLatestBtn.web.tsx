import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {LoadLatestBtn as LoadLatestBtnMobile} from './LoadLatestBtnMobile'
import {HITSLOP_20} from 'lib/constants'

export const LoadLatestBtn = ({
  onPress,
  label,
  showIndicator,
  minimalShellMode,
}: {
  onPress: () => void
  label: string
  showIndicator: boolean
  minimalShellMode?: boolean
}) => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  if (isMobile) {
    return (
      <LoadLatestBtnMobile
        onPress={onPress}
        label={label}
        showIndicator={showIndicator}
      />
    )
  }
  return (
    <>
      {showIndicator && (
        <TouchableOpacity
          style={[
            pal.view,
            pal.borderDark,
            styles.loadLatestCentered,
            minimalShellMode && styles.loadLatestCenteredMinimal,
          ]}
          onPress={onPress}
          hitSlop={HITSLOP_20}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="">
          <Text type="md-bold" style={pal.text}>
            {label}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[pal.view, pal.borderDark, styles.loadLatest]}
        onPress={onPress}
        hitSlop={HITSLOP_20}
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
      </TouchableOpacity>
    </>
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
  loadLatestCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: '50vw',
    // @ts-ignore web only -prf
    transform: 'translateX(-50%)',
    top: 60,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
  },
  loadLatestCenteredMinimal: {
    top: 20,
  },
})
