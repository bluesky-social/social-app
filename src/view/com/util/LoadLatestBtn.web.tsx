import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {Text} from './text/Text'
import {usePalette} from '../../lib/hooks/usePalette'

const HITSLOP = {left: 20, top: 20, right: 20, bottom: 20}

export const LoadLatestBtn = ({onPress}: {onPress: () => void}) => {
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      style={[pal.view, styles.loadLatest]}
      onPress={onPress}
      hitSlop={HITSLOP}>
      <Text type="md-bold" style={pal.text}>
        Load new posts
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  loadLatest: {
    flexDirection: 'row',
    position: 'absolute',
    left: 'calc(50vw - 80px)',
    top: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
  },
})
