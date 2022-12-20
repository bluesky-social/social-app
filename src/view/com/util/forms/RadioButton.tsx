import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from '../Text'
import {colors} from '../../../lib/styles'

export function RadioButton({
  label,
  isSelected,
  onPress,
}: {
  label: string
  isSelected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.outer} onPress={onPress}>
      <View style={styles.circle}>
        {isSelected ? <View style={styles.circleFill} /> : undefined}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.gray3,
    marginRight: 10,
  },
  circleFill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue3,
  },
  label: {
    flex: 1,
    fontSize: 17,
  },
})
