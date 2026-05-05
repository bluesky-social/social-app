import {StyleSheet, View} from 'react-native'

import {atoms as a} from '#/alf'

type Props = {
  count: number
  activeIndex: number
}

const ACTIVE = 6
const INACTIVE = 4
const GAP = 5

export function PagerDots({count, activeIndex}: Props) {
  if (count <= 1) return null
  return (
    <View style={[a.flex_row, a.align_center, a.justify_center, styles.row]}>
      {Array.from({length: count}).map((_, i) => {
        const isActive = i === activeIndex
        return (
          <View
            key={i}
            style={[
              isActive ? styles.active : styles.inactive,
              isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: GAP,
  },
  activeDot: {
    width: ACTIVE,
    height: ACTIVE,
    borderRadius: ACTIVE / 2,
  },
  inactiveDot: {
    width: INACTIVE,
    height: INACTIVE,
    borderRadius: INACTIVE / 2,
  },
  active: {
    backgroundColor: '#fff',
  },
  inactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
})
