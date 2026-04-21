import {StyleSheet, View} from 'react-native'

import {atoms as a} from '#/alf'

type Props = {
  count: number
  activeIndex: number
}

const DOT = 6
const GAP = 4

export function PagerDots({count, activeIndex}: Props) {
  if (count <= 1) return null
  return (
    <View style={[a.flex_row, a.justify_center, a.align_center, styles.row]}>
      {Array.from({length: count}).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: GAP,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  active: {
    backgroundColor: '#fff',
  },
  inactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
})
