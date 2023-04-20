import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {UpIcon} from 'lib/icons'
import {LoadLatestBtn as LoadLatestBtnMobile} from './LoadLatestBtnMobile'
import {isMobileWeb} from 'platform/detection'

const HITSLOP = {left: 20, top: 20, right: 20, bottom: 20}

export const LoadLatestBtn = ({
  onPress,
  label,
}: {
  onPress: () => void
  label: string
}) => {
  const pal = usePalette('default')
  if (isMobileWeb) {
    return <LoadLatestBtnMobile onPress={onPress} label={label} />
  }
  return (
    <TouchableOpacity
      style={[pal.view, pal.borderDark, styles.loadLatest]}
      onPress={onPress}
      hitSlop={HITSLOP}>
      <Text type="md-bold" style={pal.text}>
        <UpIcon size={16} strokeWidth={1} style={[pal.text, styles.icon]} />
        Load new {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  loadLatest: {
    flexDirection: 'row',
    position: 'absolute',
    left: '50vw',
    // @ts-ignore web only -prf
    transform: 'translateX(-50%)',
    top: 60,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    paddingLeft: 20,
    paddingRight: 24,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
  },
  icon: {
    position: 'relative',
    top: 2,
    marginRight: 5,
  },
})
