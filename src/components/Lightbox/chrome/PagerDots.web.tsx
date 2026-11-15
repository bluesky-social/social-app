import {StyleSheet, View} from 'react-native'

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
    <View style={styles.root}>
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
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    // @ts-expect-error web-only
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
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
